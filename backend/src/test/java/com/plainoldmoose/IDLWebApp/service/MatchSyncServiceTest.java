package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.client.OpenDotaClient;
import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GameDetails;
import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GamePlayer;
import com.plainoldmoose.IDLWebApp.client.SteamClient;
import com.plainoldmoose.IDLWebApp.client.SteamClient.LeagueGame;
import com.plainoldmoose.IDLWebApp.dto.request.CreateMatchRequest;
import com.plainoldmoose.IDLWebApp.dto.response.season.LeagueSyncResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.PendingMatchResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.PendingPlayerResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.TeamMember;
import com.plainoldmoose.IDLWebApp.model.enums.LeagueMatchStatus;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.LeagueMatch;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.LeagueMatchRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

class MatchSyncServiceTest {

    private static final long LEAGUE = 15728L;
    private static final LocalDateTime PLAYED = LocalDateTime.now().minusDays(1).truncatedTo(ChronoUnit.SECONDS);

    private final SteamClient steam = mock(SteamClient.class);
    private final OpenDotaClient openDota = mock(OpenDotaClient.class);
    private final SeasonRepository seasons = mock(SeasonRepository.class);
    private final MatchRepository matches = mock(MatchRepository.class);
    private final LeagueMatchRepository leagueMatches = mock(LeagueMatchRepository.class);
    private final PlayerRepository players = mock(PlayerRepository.class);
    private final MatchService matchService = mock(MatchService.class);
    private final MatchSyncService service = new MatchSyncService(steam, openDota, seasons, matches, leagueMatches, players, matchService,
            new TransactionTemplate(mock(PlatformTransactionManager.class)));

    // Registered players "0" to "11": 0-4 on the first team, 5-9 on the second, 10 and 11 on neither
    private final List<Player> everyone = IntStream.range(0, 12).mapToObj(i -> {
        Player player = new Player();
        player.setSteamId(String.valueOf(i));
        player.setUsername("p" + i);
        return player;
    }).toList();
    private final Season season = new Season();
    private final Team first = team(0);
    private final Team second = team(5);
    private final List<LeagueGame> games = new ArrayList<>();

    MatchSyncServiceTest() {
        season.setId(UUID.randomUUID());
        season.setStatus(SeasonStatus.ACTIVE);
        season.setStartDate(LocalDate.now().minusWeeks(2));
        season.setLeagueId(LEAGUE);
        season.setTeams(List.of(first, second));
        when(seasons.findById(season.getId())).thenReturn(Optional.of(season));
        when(seasons.findAll()).thenReturn(List.of(season));
        when(steam.leagueMatches(LEAGUE)).thenReturn(games);
        when(players.findAllById(any())).thenAnswer(call -> {
            Iterable<String> ids = call.getArgument(0);
            List<String> wanted = new ArrayList<>();
            ids.forEach(wanted::add);
            return everyone.stream().filter(player -> wanted.contains(player.getSteamId())).toList();
        });
    }

    private Team team(int firstPlayer) {
        Team team = new Team();
        team.setTeamId(UUID.randomUUID());
        everyone.subList(firstPlayer, firstPlayer + 5).forEach(player -> {
            TeamMember member = new TeamMember();
            member.setPlayer(player);
            team.getMembers().add(member);
        });
        return team;
    }

    // Dota's times are Unix seconds, stored as UTC like the rest of the matches
    private static long epoch(LocalDateTime time) {
        return time.toEpochSecond(ZoneOffset.UTC);
    }

    private static List<GamePlayer> gamePlayers(List<String> radiant, List<String> dire) {
        return Stream.concat(
                radiant.stream().map(id -> new GamePlayer(id, true)),
                dire.stream().map(id -> new GamePlayer(id, false))).toList();
    }

    // A game on the ticket that OpenDota has too: a normal 40 minutes with kills, last hits and nobody abandoning.
    // A null Steam ID is a private profile
    private void game(long matchId, LocalDateTime played, boolean radiantWin, List<String> radiant, List<String> dire) {
        game(matchId, played, radiantWin, radiant, dire, 40 * 60, 45, 3000, 0);
    }

    private void game(long matchId, LocalDateTime played, boolean radiantWin, List<String> radiant, List<String> dire,
                      int duration, int kills, int lastHits, int abandons) {
        games.add(new LeagueGame(matchId, epoch(played), gamePlayers(radiant, dire)));
        when(openDota.match(matchId)).thenReturn(Optional.of(new GameDetails(epoch(played), radiantWin, gamePlayers(radiant, dire),
                duration, kills, lastHits, abandons)));
    }

    // A clean game apart from how it was played
    private void playedGame(int duration, int kills, int lastHits, int abandons) {
        game(1L, PLAYED, true, ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9), duration, kills, lastHits, abandons);
    }

    // A game on the ticket that OpenDota hasn't fetched
    private void steamOnlyGame(LocalDateTime played, List<String> radiant, List<String> dire) {
        games.add(new LeagueGame(1L, epoch(played), gamePlayers(radiant, dire)));
        when(openDota.match(1L)).thenReturn(Optional.empty());
    }

    private void game(List<String> radiant, List<String> dire) {
        game(1L, PLAYED, true, radiant, dire);
    }

    private static List<String> ids(int... ids) {
        return IntStream.of(ids).mapToObj(String::valueOf).toList();
    }

    private CreateMatchRequest imported() {
        ArgumentCaptor<CreateMatchRequest> request = ArgumentCaptor.forClass(CreateMatchRequest.class);
        verify(matchService).create(request.capture());
        return request.getValue();
    }

    private LeagueMatch saved() {
        ArgumentCaptor<LeagueMatch> saved = ArgumentCaptor.forClass(LeagueMatch.class);
        // The last save: an imported game's row is saved once, a refused one again with why
        verify(leagueMatches, atLeastOnce()).save(saved.capture());
        return saved.getValue();
    }

    private LeagueMatch pending() {
        service.sync(season.getId());
        verify(matchService, never()).create(any());
        LeagueMatch match = saved();
        assertEquals(LeagueMatchStatus.PENDING, match.getStatus());
        return match;
    }

    // Behaviours 1 and 32: the start time comes back as UTC
    @Test
    void importsACleanMatch() {
        game(ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9));

        service.sync(season.getId());

        CreateMatchRequest request = imported();
        assertEquals(1L, request.matchId());
        assertEquals(season.getId(), request.seasonId());
        assertEquals(PLAYED, request.playedTime());
        assertEquals(first.getTeamId(), request.radiantTeamId());
        assertEquals(second.getTeamId(), request.direTeamId());
        assertEquals(Side.RADIANT, request.winner());
        assertEquals(ids(0, 1, 2, 3, 4), request.radiant());
        assertEquals(ids(5, 6, 7, 8, 9), request.dire());
        assertTrue(request.subbingFor() == null || request.subbingFor().isEmpty());
    }

    // Behaviour 41: the row goes in first, so create marks it imported along with the match and a synced match is never
    // without one
    @Test
    void savesTheRowBeforeImporting() {
        game(ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9));

        service.sync(season.getId());

        InOrder order = inOrder(leagueMatches, matchService);
        order.verify(leagueMatches).save(argThat(row -> row.getMatchId() == 1L && row.getReason() == null));
        order.verify(matchService).create(any());
        verify(leagueMatches).save(any());
    }

    // Behaviour 1: a side is the team with 3+ of its players, whichever side that team played
    @Test
    void mapsEachSideToTheTeamWithAMajority() {
        game(1L, PLAYED, false, ids(5, 6, 7, 10, 11), ids(0, 1, 2, 3, 4));

        service.sync(season.getId());

        CreateMatchRequest request = imported();
        assertEquals(second.getTeamId(), request.radiantTeamId());
        assertEquals(first.getTeamId(), request.direTeamId());
        assertEquals(Side.DIRE, request.winner());
    }

    // Behaviour 1: the ELO replay is cheapest, and K's game counts right, played in order
    @Test
    void importsOldestFirst() {
        game(2L, PLAYED, true, ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9));
        game(1L, PLAYED.minusHours(2), true, ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9));

        service.sync(season.getId());

        InOrder order = inOrder(matchService);
        order.verify(matchService).create(argThat(request -> request.matchId() == 1L));
        order.verify(matchService).create(argThat(request -> request.matchId() == 2L));
    }

    // Behaviour 2
    @Test
    void skipsMatchesAlreadySeen() {
        game(1L, PLAYED, true, ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9));
        game(2L, PLAYED, true, ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9));
        when(matches.existsById(1L)).thenReturn(true);
        when(leagueMatches.existsById(2L)).thenReturn(true);

        service.sync(season.getId());

        verify(openDota, never()).match(anyLong());
        verify(matchService, never()).create(any());
    }

    // Behaviour 3
    @Test
    void privateProfileWaitsForAnAdmin() {
        List<String> radiant = new ArrayList<>(ids(0, 1, 2, 3));
        radiant.add(null);
        game(radiant, ids(5, 6, 7, 8, 9));

        LeagueMatch match = pending();

        assertEquals("1 private profile", match.getReason());
        assertEquals(ids(0, 1, 2, 3), match.getRadiant());
        assertEquals(ids(5, 6, 7, 8, 9), match.getDire());
        assertEquals(1L, match.getMatchId());
        assertEquals(PLAYED, match.getPlayedTime());
        assertEquals(Side.RADIANT, match.getWinner());
        assertSame(season, match.getSeason());
    }

    // Behaviour 4
    @Test
    void unregisteredAccountWaitsForAnAdmin() {
        game(ids(0, 1, 2, 3, 4), List.of("5", "6", "7", "8", "76561198051995905"));

        LeagueMatch match = pending();

        assertEquals("1 unregistered account", match.getReason());
        assertTrue(match.getDire().contains("76561198051995905"));
    }

    // Behaviour 5: the radiant side has no team with 3 of its players; dire's guess is still kept
    @Test
    void sidesThatDontMatchTwoTeamsWaitForAnAdmin() {
        game(ids(0, 1, 5, 6, 10), ids(2, 3, 7, 8, 9));

        LeagueMatch match = pending();

        assertEquals("Sides don't match two season teams", match.getReason());
        assertNull(match.getRadiantTeam());
        assertSame(second, match.getDireTeam());
    }

    // Behaviour 6
    @Test
    void gamePlayedBeforeTheSeasonWaitsForAnAdmin() {
        game(1L, season.getStartDate().atStartOfDay().minusDays(1), true, ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9));

        LeagueMatch match = pending();

        assertEquals("Played before the season started", match.getReason());
        assertSame(first, match.getRadiantTeam());
        assertSame(second, match.getDireTeam());
    }

    // Behaviour 7: one sub and one team member missing, so the sub stood in for them
    @Test
    void guessesWhoALoneSubStoodInFor() {
        game(ids(0, 1, 2, 3, 10), ids(5, 6, 7, 8, 9));

        service.sync(season.getId());

        assertEquals(Map.of("10", "4"), imported().subbingFor());
    }

    @Test
    void doesntGuessForTwoSubs() {
        game(ids(0, 1, 2, 10, 11), ids(5, 6, 7, 8, 9));

        service.sync(season.getId());

        CreateMatchRequest request = imported();
        assertTrue(request.subbingFor() == null || request.subbingFor().isEmpty());
    }

    // Behaviour 8
    @Test
    void matchTheCreateRuleRefusesWaitsForAnAdmin() {
        game(ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9));
        doThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "A match needs 10 different registered players"))
                .when(matchService).create(any());

        service.sync(season.getId());

        LeagueMatch match = saved();
        assertEquals(LeagueMatchStatus.PENDING, match.getStatus());
        assertEquals("A match needs 10 different registered players", match.getReason());
    }

    // Behaviour 9
    @Test
    void timerSyncsOnlyActiveSeasonsWithATicket() {
        Season noTicket = new Season();
        noTicket.setStatus(SeasonStatus.ACTIVE);
        Season finished = new Season();
        finished.setStatus(SeasonStatus.COMPLETED);
        finished.setLeagueId(111L);
        Season broken = new Season();
        broken.setStatus(SeasonStatus.ACTIVE);
        broken.setLeagueId(222L);
        broken.setTeams(List.of());
        when(seasons.findAll()).thenReturn(List.of(broken, noTicket, finished, season));
        when(steam.leagueMatches(222L)).thenThrow(new RestClientException("Connection reset"));

        service.syncAll();

        verify(steam).leagueMatches(222L);
        verify(steam).leagueMatches(LEAGUE);
        verify(steam, never()).leagueMatches(111L);
        assertNotNull(season.getLeagueSyncedAt());
        assertNotNull(broken.getLeagueSyncError());
    }

    // Behaviour 10
    @Test
    void successfulSyncClearsTheLastError() {
        season.setLeagueSyncError("Couldn't reach OpenDota");

        service.sync(season.getId());

        assertNull(season.getLeagueSyncError());
        assertNotNull(season.getLeagueSyncedAt());
        verify(seasons).save(season);
    }

    @Test
    void failedSyncIsRecordedAndReported() {
        LocalDateTime lastGood = PLAYED;
        season.setLeagueSyncedAt(lastGood);
        when(steam.leagueMatches(LEAGUE)).thenThrow(new RestClientException("Connection reset"));

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.sync(season.getId()));

        assertEquals(HttpStatus.BAD_GATEWAY, e.getStatusCode());
        assertNotNull(season.getLeagueSyncError());
        assertEquals(lastGood, season.getLeagueSyncedAt());
        verify(seasons).save(season);
    }

    @Test
    void manualSyncNeedsAnActiveSeasonWithATicket() {
        ResponseStatusException missing = assertThrows(ResponseStatusException.class, () -> service.sync(UUID.randomUUID()));
        assertEquals(HttpStatus.NOT_FOUND, missing.getStatusCode());

        season.setLeagueId(null);
        ResponseStatusException noTicket = assertThrows(ResponseStatusException.class, () -> service.sync(season.getId()));
        assertEquals(HttpStatus.CONFLICT, noTicket.getStatusCode());

        season.setLeagueId(LEAGUE);
        season.setStatus(SeasonStatus.COMPLETED);
        ResponseStatusException finished = assertThrows(ResponseStatusException.class, () -> service.sync(season.getId()));
        assertEquals(HttpStatus.CONFLICT, finished.getStatusCode());
    }

    // Behaviour 30: OpenDota usually has it within minutes of being asked
    @Test
    void gameOpenDotaHasntGotIsRequestedAndTriedAgainLater() {
        steamOnlyGame(LocalDateTime.now(ZoneOffset.UTC).minusHours(1), ids(0, 1, 2, 3, 4), ids(5, 6, 7, 8, 9));

        service.sync(season.getId());

        verify(openDota).requestParse(1L);
        verify(leagueMatches, never()).save(any());
        verify(matchService, never()).create(any());
    }

    // Behaviour 31: a day on, it's not coming, so an admin gets it with what Steam knows
    @Test
    void gameOpenDotaNeverGotWaitsForAnAdminWithSteamsPlayers() {
        LocalDateTime played = LocalDateTime.now(ZoneOffset.UTC).minusDays(2).truncatedTo(ChronoUnit.SECONDS);
        List<String> radiant = new ArrayList<>(ids(0, 1, 2, 3));
        radiant.add(null);
        steamOnlyGame(played, radiant, ids(5, 6, 7, 8, 9));

        LeagueMatch match = pending();

        verify(openDota, never()).requestParse(anyLong());
        assertEquals("OpenDota doesn't have this game", match.getReason());
        assertNull(match.getWinner());
        assertEquals(played, match.getPlayedTime());
        assertEquals(ids(0, 1, 2, 3), match.getRadiant());
        assertEquals(ids(5, 6, 7, 8, 9), match.getDire());
        assertSame(first, match.getRadiantTeam());
        assertSame(second, match.getDireTeam());
    }

    // Behaviour 33: the panel shows why, e.g. a missing key, not just that it failed
    @Test
    void failedSyncSaysWhatWentWrong() {
        when(steam.leagueMatches(LEAGUE)).thenThrow(new RestClientException("Steam API key isn't set"));

        assertThrows(ResponseStatusException.class, () -> service.sync(season.getId()));

        assertEquals("Steam API key isn't set", season.getLeagueSyncError());
    }

    // Behaviour 36: like 9037005272, where everyone left at level 1 and the creeps finished it
    @Test
    void gameNobodyPlayedWaitsForAnAdmin() {
        playedGame(55 * 60, 0, 0, 0);

        assertEquals("Nobody played: everyone left at the start", pending().getReason());
    }

    // Behaviour 37: remakes and early GGs
    @Test
    void shortGameWaitsForAnAdmin() {
        playedGame(9 * 60 + 59, 10, 400, 0);

        assertEquals("Only lasted 9 minutes", pending().getReason());
    }

    @Test
    void fifteenMinuteGameCounts() {
        playedGame(15 * 60, 10, 400, 0);

        service.sync(season.getId());

        assertEquals(1L, imported().matchId());
    }

    // Behaviour 38
    @Test
    void gameSomeoneAbandonedWaitsForAnAdmin() {
        playedGame(40 * 60, 45, 3000, 1);

        assertEquals("1 player abandoned", pending().getReason());
    }

    // Behaviour 39
    @Test
    void reasonsAddUp() {
        game(1L, PLAYED, true, ids(0, 1, 2, 3, 76561198), ids(5, 6, 7, 8, 9), 12 * 60, 20, 900, 2);

        assertEquals("1 unregistered account, Only lasted 12 minutes, 2 players abandoned", pending().getReason());
    }

    private LeagueMatch pendingRow() {
        LeagueMatch match = new LeagueMatch();
        match.setMatchId(1L);
        match.setSeason(season);
        match.setStatus(LeagueMatchStatus.PENDING);
        match.setPlayedTime(PLAYED);
        match.setWinner(Side.DIRE);
        match.setRadiantTeam(first);
        match.setRadiant(new ArrayList<>(ids(0, 1, 2, 3)));
        match.setDire(new ArrayList<>(List.of("5", "6", "7", "8", "76561198051995905")));
        match.setReason("1 private profile, 1 unregistered account");
        return match;
    }

    // Behaviour 11
    @Test
    void rejectingRemembersIt() {
        LeagueMatch match = pendingRow();
        when(leagueMatches.findByMatchIdAndSeasonIdAndStatus(1L, season.getId(), LeagueMatchStatus.PENDING))
                .thenReturn(Optional.of(match));

        service.reject(season.getId(), 1L);

        assertEquals(LeagueMatchStatus.REJECTED, match.getStatus());
    }

    @Test
    void rejectingSomethingNotPendingIsNotFound() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.reject(season.getId(), 1L));
        assertEquals(HttpStatus.NOT_FOUND, e.getStatusCode());
    }

    // Behaviour 12
    @Test
    void showsTheSyncStateAndQueue() {
        season.setLeagueSyncedAt(PLAYED);
        season.setLeagueSyncError("Couldn't reach OpenDota");
        when(leagueMatches.findBySeasonIdAndStatusOrderByPlayedTimeAsc(season.getId(), LeagueMatchStatus.PENDING))
                .thenReturn(List.of(pendingRow()));

        LeagueSyncResponse sync = service.getLeagueSync(season.getId());

        assertEquals(PLAYED, sync.syncedAt());
        assertEquals("Couldn't reach OpenDota", sync.error());
        PendingMatchResponse match = sync.pending().get(0);
        assertEquals(1L, match.matchId());
        assertEquals(PLAYED, match.playedTime());
        assertEquals(Side.DIRE, match.winner());
        assertEquals(first.getTeamId(), match.radiantTeamId());
        assertNull(match.direTeamId());
        assertEquals(new PendingPlayerResponse("0", "p0"), match.radiant().get(0));
        assertEquals(4, match.radiant().size());
        assertEquals(new PendingPlayerResponse("76561198051995905", null), match.dire().get(4));
        assertEquals("1 private profile, 1 unregistered account", match.reason());
    }

    @Test
    void syncStateForAnUnknownSeasonIsNotFound() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.getLeagueSync(UUID.randomUUID()));
        assertEquals(HttpStatus.NOT_FOUND, e.getStatusCode());
    }
}
