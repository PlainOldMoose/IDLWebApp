package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.draft.DraftPlayerResponse;
import com.plainoldmoose.IDLWebApp.dto.response.draft.DraftResponse;
import com.plainoldmoose.IDLWebApp.dto.response.draft.DraftTeamResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.SeasonSignup;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.TeamMember;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import com.plainoldmoose.IDLWebApp.repository.TeamRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// Sign-ups close into a draft: the first willing captains get a team each, and the team with the lowest total draft
// score picks next until the pool is empty. An admin then starts the season
@Service
@AllArgsConstructor
public class DraftService {

    private static final int TEAM_SIZE = 5;
    private static final int MIN_TEAMS = 2;
    // The league sheet's own shift (its "-111+50"), so scores match the drafts run there
    private static final int SCORE_SHIFT = -61;

    private final SeasonRepository seasonRepository;
    private final TeamRepository teamRepository;

    // Linear in ELO above the cutoff; below it the gaps shrink to 0.8, so the weakest players don't drag a team's total
    // down as far. Cutoff is the Nth-lowest drafted ELO (N = team count), lowest is the lowest drafted ELO
    public static int draftScore(double elo, double cutoff, double lowest) {
        double score = elo <= cutoff ? 0.8 * (elo - lowest) : elo - cutoff + 0.8 * (cutoff - lowest);
        return (int) Math.round(score) + SCORE_SHIFT;
    }

    @Transactional
    public void closeSignups(UUID seasonId) {
        Season season = findSeason(seasonId);
        if (season.getStatus() != SeasonStatus.REGISTRATION) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sign-ups are already closed");
        }
        List<SeasonSignup> players = season.getSignups().stream()
                .filter(signup -> !signup.isSub())
                .sorted(Comparator.comparing(SeasonSignup::getSignedUpAt))
                .toList();
        List<SeasonSignup> drafted = players.subList(0, teamPlaces(players.size()));
        int teamCount = drafted.size() / TEAM_SIZE;
        if (teamCount < MIN_TEAMS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A draft needs at least " + MIN_TEAMS * TEAM_SIZE + " players");
        }

        List<Double> elos = drafted.stream().map(signup -> signup.getPlayer().getElo()).sorted().toList();
        double cutoff = elos.get(teamCount - 1);
        double lowest = elos.get(0);
        drafted.forEach(signup -> signup.setDraftScore(draftScore(signup.getPlayer().getElo(), cutoff, lowest)));

        // First come, first served; any short is made up by an admin before the first pick
        drafted.stream()
                .filter(SeasonSignup::isWillingToCaptain)
                .limit(teamCount)
                .forEach(signup -> createTeam(season, signup.getPlayer()));
        season.setStatus(SeasonStatus.DRAFTING);
    }

    // Polled by everyone watching, so it reads without the lock the writes take
    public DraftResponse getDraft(UUID seasonId) {
        Season season = requireDrafting(seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found")));
        Map<String, SeasonSignup> drafted = drafted(season);
        Team onTheClock = onTheClock(season, drafted);
        return new DraftResponse(
                pool(season, drafted).stream()
                        .sorted(Comparator.comparingInt(SeasonSignup::getDraftScore).reversed())
                        .map(DraftService::mapToPlayerResponse)
                        .toList(),
                season.getTeams().stream()
                        .map(team -> mapToTeamResponse(team, drafted))
                        .toList(),
                onTheClock != null ? onTheClock.getTeamId() : null,
                teamCount(drafted));
    }

    @Transactional
    public void makeCaptain(UUID seasonId, String steamId) {
        Season season = findDraftingSeason(seasonId);
        Map<String, SeasonSignup> drafted = drafted(season);
        requireNoPicks(season);
        if (season.getTeams().size() >= teamCount(drafted)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Every team already has a captain");
        }
        createTeam(season, findInPool(season, drafted, steamId).getPlayer());
    }

    @Transactional
    public void removeCaptain(UUID seasonId, String steamId) {
        Season season = findDraftingSeason(seasonId);
        requireNoPicks(season);
        Team team = season.getTeams().stream()
                .filter(t -> t.getCaptain().getSteamId().equals(steamId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not a captain in this draft"));
        season.getTeams().remove(team);
        teamRepository.delete(team);
    }

    @Transactional
    public void pick(UUID seasonId, String steamId, String callerSteamId, boolean admin) {
        Season season = findDraftingSeason(seasonId);
        Map<String, SeasonSignup> drafted = drafted(season);
        Team team = onTheClock(season, drafted);
        if (team == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Every team needs a captain before the picks start");
        }
        if (!admin && !team.getCaptain().getSteamId().equals(callerSteamId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "It's not your pick");
        }
        addMember(team, findInPool(season, drafted, steamId).getPlayer());
    }

    // After the last pick, so captains get to name their teams first
    @Transactional
    public void startSeason(UUID seasonId) {
        Season season = findDraftingSeason(seasonId);
        Map<String, SeasonSignup> drafted = drafted(season);
        // The pool only empties once every team has a captain and 5 players
        if (!pool(season, drafted).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Every team needs 5 players before the season starts");
        }
        season.getTeams().forEach(team -> team.setAvgElo((int) Math.round(EloService.average(
                team.getMembers().stream().map(TeamMember::getPlayer).toList()))));
        season.setStatus(SeasonStatus.ACTIVE);
    }

    @Transactional
    public void renameTeam(UUID seasonId, UUID teamId, String name, String callerSteamId, boolean admin) {
        Season season = findDraftingSeason(seasonId);
        Team team = season.getTeams().stream()
                .filter(t -> t.getTeamId().equals(teamId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
        if (!admin && !team.getCaptain().getSteamId().equals(callerSteamId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the team's captain or an admin can rename it");
        }
        team.setName(name.trim());
    }

    // Every write locks the season row until it commits, so two at once (say a captain sending two picks) run one
    // after the other instead of both picking from the same pool
    private Season findSeason(UUID seasonId) {
        return seasonRepository.findLockedById(seasonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));
    }

    private Season findDraftingSeason(UUID seasonId) {
        return requireDrafting(findSeason(seasonId));
    }

    private static Season requireDrafting(Season season) {
        if (season.getStatus() != SeasonStatus.DRAFTING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This season isn't drafting");
        }
        return season;
    }

    // Teams are 5 each, so the latest player sign-ups past a multiple of 5 are subs. Under 5 there's no full team, so
    // nobody overflows. SeasonSignupService uses this to list them as subs
    public static int teamPlaces(int players) {
        return players < TEAM_SIZE ? players : players - players % TEAM_SIZE;
    }

    // By Steam ID: everyone who got a score when sign-ups closed, captains included
    private static Map<String, SeasonSignup> drafted(Season season) {
        return season.getSignups().stream()
                .filter(signup -> signup.getDraftScore() != null)
                .collect(Collectors.toMap(signup -> signup.getPlayer().getSteamId(), Function.identity()));
    }

    private static int teamCount(Map<String, SeasonSignup> drafted) {
        return drafted.size() / TEAM_SIZE;
    }

    private static List<SeasonSignup> pool(Season season, Map<String, SeasonSignup> drafted) {
        Set<String> onTeams = season.getTeams().stream()
                .flatMap(team -> team.getMembers().stream())
                .map(member -> member.getPlayer().getSteamId())
                .collect(Collectors.toSet());
        return drafted.values().stream()
                .filter(signup -> !onTeams.contains(signup.getPlayer().getSteamId()))
                .toList();
    }

    private static SeasonSignup findInPool(Season season, Map<String, SeasonSignup> drafted, String steamId) {
        return pool(season, drafted).stream()
                .filter(signup -> signup.getPlayer().getSteamId().equals(steamId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "That player isn't in the pool"));
    }

    private static void requireNoPicks(Season season) {
        if (season.getTeams().stream().anyMatch(team -> team.getMembers().size() > 1)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Captains are fixed once the picks start");
        }
    }

    private static int total(Team team, Map<String, SeasonSignup> drafted) {
        return team.getMembers().stream().mapToInt(member -> score(member.getPlayer(), drafted)).sum();
    }

    private static int score(Player player, Map<String, SeasonSignup> drafted) {
        return drafted.get(player.getSteamId()).getDraftScore();
    }

    // Lowest total among teams with room, ties to the weaker captain, then the earlier captain sign-up. Nobody until
    // every team has a captain
    private static Team onTheClock(Season season, Map<String, SeasonSignup> drafted) {
        if (season.getTeams().size() < teamCount(drafted)) return null;
        return season.getTeams().stream()
                .filter(team -> team.getMembers().size() < TEAM_SIZE)
                .min(Comparator.<Team>comparingInt(team -> total(team, drafted))
                        .thenComparingInt(team -> score(team.getCaptain(), drafted))
                        .thenComparing(team -> drafted.get(team.getCaptain().getSteamId()).getSignedUpAt()))
                .orElse(null);
    }

    private void createTeam(Season season, Player captain) {
        Team team = new Team();
        team.setSeason(season);
        team.setName(captain.getUsername() + "'s team");
        team.setCaptain(captain);
        addMember(team, captain);
        season.getTeams().add(teamRepository.save(team));
    }

    private static void addMember(Team team, Player player) {
        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setPlayer(player);
        team.getMembers().add(member);
    }

    private static DraftPlayerResponse mapToPlayerResponse(SeasonSignup signup) {
        return new DraftPlayerResponse(
                signup.getPlayer().getSteamId(),
                signup.getPlayer().getUsername(),
                signup.getPlayer().getElo(),
                signup.getDraftScore(),
                signup.getRolePreference(),
                signup.isWillingToCaptain());
    }

    // Captain first, then highest score first
    private static DraftTeamResponse mapToTeamResponse(Team team, Map<String, SeasonSignup> drafted) {
        String captain = team.getCaptain().getSteamId();
        return new DraftTeamResponse(
                team.getTeamId(),
                team.getName(),
                captain,
                team.getMembers().stream()
                        .map(member -> drafted.get(member.getPlayer().getSteamId()))
                        .sorted(Comparator.<SeasonSignup>comparingInt(signup -> signup.getPlayer().getSteamId().equals(captain) ? 0 : 1)
                                .thenComparing(Comparator.comparingInt(SeasonSignup::getDraftScore).reversed()))
                        .map(DraftService::mapToPlayerResponse)
                        .toList(),
                total(team, drafted));
    }
}
