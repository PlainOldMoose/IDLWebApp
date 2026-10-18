package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.client.OpenDotaClient;
import com.plainoldmoose.IDLWebApp.client.SteamClient;
import com.plainoldmoose.IDLWebApp.client.SteamClient.LeagueGame;
import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GameDetails;
import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GamePlayer;
import com.plainoldmoose.IDLWebApp.dto.request.CreateMatchRequest;
import com.plainoldmoose.IDLWebApp.dto.response.season.LeagueSyncResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.PendingMatchResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.PendingPlayerResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.LeagueMatchStatus;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.LeagueMatch;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.LeagueMatchRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

// Pulls each active season's ticketed games: the list from Steam, each new game's details from OpenDota. Clean ones go in through MatchService.create, the rest wait
// for an admin. Not transactional itself: each create is its own transaction, so one refused game doesn't roll back
// the games imported before it
@Slf4j
@Service
@AllArgsConstructor
public class MatchSyncService {
    private static final String SEASON_NOT_FOUND = "Season not found";
    // Shorter is a remake or an early GG, which an admin decides on
    private static final int MIN_DURATION_SECONDS = 15 * 60;

    private final SteamClient steam;
    private final OpenDotaClient openDota;
    private final SeasonRepository seasonRepository;
    private final MatchRepository matchRepository;
    private final LeagueMatchRepository leagueMatchRepository;
    private final PlayerRepository playerRepository;
    private final MatchService matchService;
    private final TransactionTemplate transactions;

    // NOTE: one Steam call per season with a ticket (per 100 games), plus one OpenDota call per new game. Well inside
    // OpenDota's free 3000 a day
    @Scheduled(fixedDelayString = "${app.league-sync.interval:PT30M}", initialDelayString = "PT1M")
    public void syncAll() {
        // Off a request there's no open session to load teams on demand like "Sync now" has, so the rosters are
        // loaded up front
        List<Season> seasons = transactions.execute(status -> {
            List<Season> active = seasonRepository.findAll()
                    .stream()
                    .filter(season -> season.getStatus() == SeasonStatus.ACTIVE && season.getLeagueId() != null)
                    .toList();
            active.forEach(season -> season.getTeams().forEach(team -> team.getMembers().size()));
            return active;
        });
        for (Season season : seasons) {
            try {
                run(season);
            } catch (RuntimeException e) {
                log.warn("League sync failed for season {}", season.getId(), e);
            }
        }
    }

    // An admin's "Sync now"
    public void sync(UUID seasonId) {
        Season season = findSeason(seasonId);
        if (season.getStatus() != SeasonStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only an active season's games are synced");
        }
        if (season.getLeagueId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Set the season's league ticket first");
        }
        try {
            run(season);
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, e.getMessage(), e);
        }
    }

    public LeagueSyncResponse getLeagueSync(UUID seasonId) {
        Season season = findSeason(seasonId);
        List<LeagueMatch> pending = leagueMatchRepository.findBySeasonIdAndStatusOrderByPlayedTimeAsc(seasonId, LeagueMatchStatus.PENDING);
        Map<String, String> usernames = playerRepository.findAllById(pending.stream()
                        .flatMap(match -> Stream.concat(match.getRadiant().stream(), match.getDire().stream()))
                        .distinct()
                        .toList())
                .stream()
                .collect(Collectors.toMap(Player::getSteamId, Player::getUsername));
        return new LeagueSyncResponse(season.getLeagueSyncedAt(), season.getLeagueSyncError(), pending.stream()
                .map(match -> new PendingMatchResponse(match.getMatchId(), match.getPlayedTime(), match.getWinner(),
                        teamId(match.getRadiantTeam()), teamId(match.getDireTeam()),
                        players(match.getRadiant(), usernames), players(match.getDire(), usernames),
                        match.getReason()))
                .toList());
    }

    // Kept, so the next sync doesn't bring it back
    @Transactional
    public void reject(UUID seasonId, Long matchId) {
        leagueMatchRepository.findByMatchIdAndSeasonIdAndStatus(matchId, seasonId, LeagueMatchStatus.PENDING)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No game " + matchId + " waiting to be checked"))
                .setStatus(LeagueMatchStatus.REJECTED);
    }

    // Records how it went on the season either way
    private void run(Season season) {
        try {
            List<LeagueGame> games = steam.leagueMatches(season.getLeagueId())
                    .stream()
                    .filter(game -> !matchRepository.existsById(game.matchId()) && !leagueMatchRepository.existsById(game.matchId()))
                    // Oldest first, like the ELO replay, so each game's K counts the ones before it
                    .sorted(Comparator.comparingLong(LeagueGame::startTime).thenComparingLong(LeagueGame::matchId))
                    .toList();
            for (LeagueGame game : games) {
                Optional<GameDetails> details = openDota.match(game.matchId());
                if (details.isPresent()) {
                    importGame(season, game, details.get());
                } else if (utc(game.startTime()).isBefore(LocalDateTime.now(ZoneOffset.UTC).minusDays(1))) {
                    // A day on it isn't coming, so an admin gets it with what Steam knows: everything but the winner
                    importGame(season, game, null);
                } else {
                    // Left unrecorded, so the next sync looks again once OpenDota has fetched it
                    openDota.requestParse(game.matchId());
                }
            }
            season.setLeagueSyncedAt(LocalDateTime.now());
            season.setLeagueSyncError(null);
        } catch (RestClientException e) {
            log.warn("League sync failed for league {}", season.getLeagueId(), e);
            season.setLeagueSyncError(e.getMessage());
            throw e;
        } finally {
            seasonRepository.save(season);
        }
    }

    // Null details is a game OpenDota never got, which can only wait for an admin: Steam knows everything but the winner
    private void importGame(Season season, LeagueGame game, GameDetails details) {
        long matchId = game.matchId();
        LocalDateTime played = utc(details == null ? game.startTime() : details.startTime());
        List<GamePlayer> players = details == null ? game.players() : details.players();
        Side winner = details == null ? null : details.radiantWin() ? Side.RADIANT : Side.DIRE;
        List<String> radiant = steamIds(players, true);
        List<String> dire = steamIds(players, false);
        int privateProfiles = (int) players.stream().filter(player -> player.steamId() == null).count();
        Team radiantTeam = majority(season, radiant);
        Team direTeam = majority(season, dire);

        LeagueMatch match = new LeagueMatch();
        match.setMatchId(matchId);
        match.setSeason(season);
        match.setPlayedTime(played);
        match.setWinner(winner);
        match.setRadiant(new ArrayList<>(radiant));
        match.setDire(new ArrayList<>(dire));
        match.setRadiantTeam(radiantTeam);
        match.setDireTeam(direTeam);

        List<String> reasons = new ArrayList<>();
        if (details == null) {
            reasons.add("OpenDota doesn't have this game");
        } else {
            reasons.addAll(problems(season, played, radiant, dire, privateProfiles, radiantTeam, direTeam, details));
        }

        match.setStatus(LeagueMatchStatus.PENDING);
        if (reasons.isEmpty()) {
            Map<String, String> subbingFor = new HashMap<>(subbingFor(radiantTeam, radiant));
            subbingFor.putAll(subbingFor(direTeam, dire));
            // Saved first, so create marks it imported in the match's own transaction: a synced match always has its row
            leagueMatchRepository.save(match);
            try {
                matchService.create(new CreateMatchRequest(matchId, season.getId(), played, radiantTeam.getTeamId(),
                        direTeam.getTeamId(), match.getWinner(), radiant, dire, subbingFor));
                return;
            } catch (ResponseStatusException e) {
                reasons.add(e.getReason());
            }
        }
        match.setReason(String.join(", ", reasons));
        leagueMatchRepository.save(match);
    }

    // Why a game OpenDota has can't go in on its own; empty when it can
    private List<String> problems(Season season, LocalDateTime played, List<String> radiant, List<String> dire, int privateProfiles,
                                  Team radiantTeam, Team direTeam, GameDetails details) {
        List<String> reasons = new ArrayList<>();
        if (played.isBefore(season.getStartDate().atStartOfDay())) {
            reasons.add("Played before the season started");
        }
        if (privateProfiles > 0) {
            reasons.add(count(privateProfiles, "private profile"));
        }
        List<Player> found = playerRepository.findAllById(Stream.concat(radiant.stream(), dire.stream()).toList());
        Set<String> registered = found.stream()
                .map(Player::getSteamId)
                .collect(Collectors.toSet());
        long unregistered = Stream.concat(radiant.stream(), dire.stream()).filter(id -> !registered.contains(id)).count();
        if (unregistered > 0) {
            reasons.add(count(unregistered, "unregistered account"));
        }
        long disabled = found.stream().filter(Player::isDisabled).count();
        if (disabled > 0) {
            reasons.add(count(disabled, "disabled account"));
        }
        if (radiantTeam == null || direTeam == null || radiantTeam == direTeam) {
            reasons.add("Sides don't match two season teams");
        }
        // Can't happen in a game ten people played, e.g. a lobby everyone left that the creeps finished
        if (details.kills() == 0 && details.lastHits() == 0) {
            reasons.add("Nobody played: everyone left at the start");
        } else if (details.duration() < MIN_DURATION_SECONDS) {
            reasons.add("Only lasted " + details.duration() / 60 + " minutes");
        }
        if (details.abandons() > 0) {
            reasons.add(count(details.abandons(), "player") + " abandoned");
        }
        return reasons;
    }

    private static LocalDateTime utc(long unixSeconds) {
        return LocalDateTime.ofEpochSecond(unixSeconds, 0, ZoneOffset.UTC);
    }

    private static List<String> steamIds(List<GamePlayer> players, boolean radiant) {
        return players.stream()
                .filter(player -> player.radiant() == radiant)
                .map(GamePlayer::steamId)
                .filter(Objects::nonNull)
                .toList();
    }

    // The team with 3 or more of a side's players; null when none has
    private static Team majority(Season season, List<String> side) {
        return season.getTeams().stream()
                .filter(team -> team.getMembers().stream().filter(member -> side.contains(member.getPlayer().getSteamId())).count() >= 3)
                .findFirst()
                .orElse(null);
    }

    // Only a guess when it can't be wrong: one sub, and one team member who didn't play
    private static Map<String, String> subbingFor(Team team, List<String> side) {
        List<String> roster = team.getMembers().stream().map(member -> member.getPlayer().getSteamId()).toList();
        List<String> subs = side.stream().filter(id -> !roster.contains(id)).toList();
        List<String> missing = roster.stream().filter(id -> !side.contains(id)).toList();
        return subs.size() == 1 && missing.size() == 1 ? Map.of(subs.get(0), missing.get(0)) : Map.of();
    }

    private static String count(long n, String thing) {
        return n + " " + thing + (n == 1 ? "" : "s");
    }

    private static UUID teamId(Team team) {
        return team == null ? null : team.getTeamId();
    }

    private static List<PendingPlayerResponse> players(List<String> steamIds, Map<String, String> usernames) {
        return steamIds.stream().map(id -> new PendingPlayerResponse(id, usernames.get(id))).toList();
    }

    private Season findSeason(UUID id) {
        return seasonRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, SEASON_NOT_FOUND));
    }
}
