package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateForfeitRequest;
import com.plainoldmoose.IDLWebApp.dto.request.CreateMatchRequest;
import com.plainoldmoose.IDLWebApp.dto.response.match.BinMatchResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.TeamStandingResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.TeamMember;
import com.plainoldmoose.IDLWebApp.model.enums.LeagueMatchStatus;
import com.plainoldmoose.IDLWebApp.model.enums.MatchSource;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.DeletedMatch;
import com.plainoldmoose.IDLWebApp.model.match.LeagueMatch;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.DeletedMatchRepository;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.LeagueMatchRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MatchServiceTest {

    private final MatchRepository matches = mock(MatchRepository.class);
    private final SeasonRepository seasons = mock(SeasonRepository.class);
    private final PlayerRepository players = mock(PlayerRepository.class);
    private final EloService elo = mock(EloService.class);
    private final EloHistoryRepository eloHistory = mock(EloHistoryRepository.class);
    private final LeagueMatchRepository leagueMatches = mock(LeagueMatchRepository.class);
    private final DeletedMatchRepository bin = mock(DeletedMatchRepository.class);
    private final MatchService service = new MatchService(matches, eloHistory, seasons, players, elo, leagueMatches, bin);

    // Players 0-4 on the first team, 5-9 on the second, and 10 and 11 on neither
    private final List<Player> everyone = IntStream.range(0, 12).mapToObj(i -> {
        Player player = new Player();
        player.setSteamId(String.valueOf(i));
        return player;
    }).toList();
    private final Season season = new Season();
    private final Team radiant = team(0);
    private final Team dire = team(5);
    // Standings tests get a season of their own, so its stored W/L can be set freely
    private static final LocalDateTime NOON = LocalDateTime.of(2026, 10, 1, 12, 0);
    private final Season league = new Season();

    MatchServiceTest() {
        season.setId(UUID.randomUUID());
        season.setStatus(SeasonStatus.ACTIVE);
        season.setStartDate(LocalDate.now().minusWeeks(2));
        season.setTeams(List.of(radiant, dire));
        when(seasons.findById(season.getId())).thenReturn(Optional.of(season));
        league.setId(UUID.randomUUID());
        league.setTeams(new ArrayList<>());
    }

    private Team team(int first) {
        Team team = new Team();
        team.setTeamId(UUID.randomUUID());
        everyone.subList(first, first + 5).forEach(player -> {
            TeamMember member = new TeamMember();
            member.setPlayer(player);
            team.getMembers().add(member);
        });
        return team;
    }

    // Radiant has player 10 standing in for player 4, and wins
    private CreateMatchRequest request() {
        return request(null);
    }

    private CreateMatchRequest request(Map<String, String> subbingFor) {
        return new CreateMatchRequest(8652158100L, season.getId(), LocalDateTime.now().minusDays(1), radiant.getTeamId(),
                dire.getTeamId(), Side.RADIANT, List.of("0", "1", "2", "3", "10"), List.of("5", "6", "7", "8", "9"), subbingFor);
    }

    // The player lookup finds everyone the request names
    private void stubPlayers() {
        when(players.findAllById(any())).thenAnswer(call -> {
            List<String> ids = call.getArgument(0);
            return everyone.stream().filter(player -> ids.contains(player.getSteamId())).toList();
        });
    }

    // Who each player stood in for, by Steam ID, from the match create() saved
    private Map<String, String> createAndGetSubbingFor(Map<String, String> subbingFor) {
        stubPlayers();
        service.create(request(subbingFor));
        ArgumentCaptor<Match> saved = ArgumentCaptor.forClass(Match.class);
        verify(matches).save(saved.capture());
        Map<String, String> result = new HashMap<>();
        saved.getValue().getParticipants().forEach(participant -> result.put(participant.getPlayer().getSteamId(),
                participant.getSubbingFor() == null ? null : participant.getSubbingFor().getSteamId()));
        return result;
    }

    // An admin adding a game from the league sync's queue takes it out of the queue
    @Test
    void addingAPendingLeagueMatchMarksItImported() {
        LeagueMatch pending = new LeagueMatch();
        pending.setMatchId(8652158100L);
        pending.setStatus(LeagueMatchStatus.PENDING);
        when(leagueMatches.findById(8652158100L)).thenReturn(Optional.of(pending));
        stubPlayers();

        service.create(request());

        assertEquals(LeagueMatchStatus.IMPORTED, pending.getStatus());
    }

    private Match createAndGetSaved() {
        stubPlayers();
        service.create(request());
        ArgumentCaptor<Match> saved = ArgumentCaptor.forClass(Match.class);
        verify(matches).save(saved.capture());
        return saved.getValue();
    }

    // Behaviour 42: the sync found it, whatever happened to it since, so it comes off the queue, the rejected list
    // or the deleted list
    @ParameterizedTest
    @EnumSource(value = LeagueMatchStatus.class, names = {"PENDING", "REJECTED", "DELETED"})
    void matchTheSyncKnowsComesOffItsListsWhenTypedIn(LeagueMatchStatus status) {
        LeagueMatch known = new LeagueMatch();
        known.setMatchId(8652158100L);
        known.setStatus(status);
        when(leagueMatches.findById(8652158100L)).thenReturn(Optional.of(known));

        createAndGetSaved();

        assertEquals(LeagueMatchStatus.IMPORTED, known.getStatus());
    }

    private Match activeSeasonMatch() {
        Match match = new Match();
        match.setMatchId(8652158100L);
        match.setSeason(season);
        match.setPlayedTime(LocalDateTime.now().minusDays(1));
        match.setMatchWinner(Side.RADIANT);
        match.setRadiantTeam(radiant);
        match.setDireTeam(dire);
        match.setParticipants(new ArrayList<>());
        when(matches.findById(8652158100L)).thenReturn(Optional.of(match));
        return match;
    }

    // Behaviour 43: on the deleted list, so the next sync leaves it out
    @Test
    void deletingASyncedMatchKeepsTheSyncFromAddingItBack() {
        activeSeasonMatch();
        LeagueMatch synced = new LeagueMatch();
        synced.setMatchId(8652158100L);
        synced.setStatus(LeagueMatchStatus.IMPORTED);
        when(leagueMatches.findById(8652158100L)).thenReturn(Optional.of(synced));

        service.delete(8652158100L);

        assertEquals(LeagueMatchStatus.DELETED, synced.getStatus());
    }

    // Behaviours 40, 41 and 45: synced when the sync ever found it, whoever typed it in
    @ParameterizedTest
    @CsvSource({"true, API_SYNC", "false, MANUAL"})
    void detailSaysWhereTheMatchCameFrom(boolean synced, MatchSource source) {
        activeSeasonMatch();
        when(matches.findBySeasonIdOrderByPlayedTimeDesc(season.getId(), Limit.unlimited())).thenReturn(List.of());
        when(leagueMatches.existsById(8652158100L)).thenReturn(synced);

        assertEquals(source, service.getMatch(8652158100L).source());
    }

    // The bin: player 10 stood in for player 4 on Radiant, players 5-9 on Dire
    private List<DeletedMatch.DeletedParticipant> binParticipants() {
        List<DeletedMatch.DeletedParticipant> list = new ArrayList<>();
        for (int i : new int[]{0, 1, 2, 3, 10, 5, 6, 7, 8, 9}) {
            DeletedMatch.DeletedParticipant p = new DeletedMatch.DeletedParticipant();
            p.setSteamId(String.valueOf(i));
            p.setSide(i < 5 || i == 10 ? Side.RADIANT : Side.DIRE);
            p.setSubbingFor(i == 10 ? "4" : null);
            list.add(p);
        }
        return list;
    }

    // Behaviour 48
    @Test
    void deletingKeepsACopyInTheBin() {
        Match match = activeSeasonMatch();
        for (int i : new int[]{0, 1, 2, 3, 10, 5, 6, 7, 8, 9}) {
            MatchParticipant participant = new MatchParticipant();
            participant.setMatch(match);
            participant.setPlayer(everyone.get(i));
            participant.setSide(i < 5 || i == 10 ? Side.RADIANT : Side.DIRE);
            participant.setSub(i == 10);
            participant.setSubbingFor(i == 10 ? everyone.get(4) : null);
            match.getParticipants().add(participant);
        }

        service.delete(8652158100L);

        ArgumentCaptor<DeletedMatch> saved = ArgumentCaptor.forClass(DeletedMatch.class);
        verify(bin).save(saved.capture());
        DeletedMatch copy = saved.getValue();
        assertEquals(8652158100L, copy.getMatchId());
        assertSame(season, copy.getSeason());
        assertEquals(match.getPlayedTime(), copy.getPlayedTime());
        assertEquals(Side.RADIANT, copy.getWinner());
        assertSame(radiant, copy.getRadiantTeam());
        assertSame(dire, copy.getDireTeam());
        assertTrue(Duration.between(copy.getDeletedAt(), LocalDateTime.now()).abs().toMinutes() < 1);
        assertEquals(List.of("0", "1", "2", "3", "10", "5", "6", "7", "8", "9"),
                copy.getParticipants().stream().map(DeletedMatch.DeletedParticipant::getSteamId).toList());
        assertEquals(Side.RADIANT, copy.getParticipants().get(4).getSide());
        assertEquals("4", copy.getParticipants().get(4).getSubbingFor());
        assertNull(copy.getParticipants().get(0).getSubbingFor());
        assertEquals(Side.DIRE, copy.getParticipants().get(5).getSide());
    }

    private DeletedMatch binned() {
        DeletedMatch copy = new DeletedMatch();
        copy.setMatchId(8652158100L);
        copy.setSeason(season);
        copy.setPlayedTime(LocalDateTime.now().minusDays(1).withNano(0));
        copy.setWinner(Side.DIRE);
        copy.setRadiantTeam(radiant);
        copy.setDireTeam(dire);
        copy.setDeletedAt(LocalDateTime.of(2026, 10, 12, 20, 0));
        copy.setParticipants(binParticipants());
        when(bin.findById(8652158100L)).thenReturn(Optional.of(copy));
        return copy;
    }

    // Behaviour 49
    @Test
    void binListsTheSeasonsDeletedMatches() {
        radiant.setName("Third Times the Charm");
        dire.setName("1 brain cell in 5 trenchcoats");
        DeletedMatch copy = binned();
        when(bin.findBySeasonIdOrderByDeletedAtDesc(season.getId())).thenReturn(List.of(copy));

        assertEquals(List.of(new BinMatchResponse(8652158100L, "Third Times the Charm", "1 brain cell in 5 trenchcoats", Side.DIRE,
                        LocalDateTime.of(2026, 10, 12, 20, 0), LocalDateTime.of(2026, 10, 19, 20, 0), false)),
                service.getBin(season.getId()));
    }

    // Behaviour 50: back exactly as it was, through the normal add, so standings and ELO replay
    @Test
    void restoringPutsTheMatchBackAsItWas() {
        DeletedMatch copy = binned();
        stubPlayers();

        service.restore(8652158100L);

        ArgumentCaptor<Match> saved = ArgumentCaptor.forClass(Match.class);
        verify(matches).save(saved.capture());
        Match match = saved.getValue();
        assertEquals(8652158100L, match.getMatchId());
        assertEquals(copy.getPlayedTime(), match.getPlayedTime());
        assertEquals(Side.DIRE, match.getMatchWinner());
        assertSame(radiant, match.getRadiantTeam());
        assertSame(dire, match.getDireTeam());
        MatchParticipant sub = match.getParticipants().stream().filter(p -> p.getPlayer().getSteamId().equals("10")).findFirst().orElseThrow();
        assertEquals(Side.RADIANT, sub.getSide());
        assertEquals("4", sub.getSubbingFor().getSteamId());
        verify(elo).replay(copy.getPlayedTime());
    }

    // Behaviour 51
    @Test
    void restoringSomethingNotInTheBinIsNotFound() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.restore(8652158100L));
        assertEquals(HttpStatus.NOT_FOUND, e.getStatusCode());
    }

    // Behaviour 52
    @Test
    void failedRestoreSaysWhyAndStaysInTheBin() {
        binned();
        stubPlayers();
        when(matches.existsById(8652158100L)).thenReturn(true);

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.restore(8652158100L));

        assertEquals("Match 8652158100 is already recorded", e.getReason());
        verify(bin, never()).deleteById(any());
        verify(bin, never()).delete(any());
    }

    // Behaviour 53: restoring, or an admin adding the same game by hand, takes it out of the bin
    @Test
    void addingAMatchTakesItOutOfTheBin() {
        createAndGetSaved();

        verify(bin).deleteById(8652158100L);
    }

    // Behaviour 54
    @Test
    void binIsClearedAfterAWeek() {
        service.purgeBin();

        ArgumentCaptor<LocalDateTime> cutoff = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(bin).deleteByDeletedAtBefore(cutoff.capture());
        assertTrue(Duration.between(cutoff.getValue(), LocalDateTime.now().minusDays(7)).abs().toMinutes() < 1);
    }

    @Test
    void recordsWhoASubReplaced() {
        Map<String, String> subbingFor = createAndGetSubbingFor(Map.of("10", "4"));

        assertEquals("4", subbingFor.get("10"));
        assertNull(subbingFor.get("0"));
    }

    @Test
    void subsWithoutAReplacementStayPlainSubs() {
        assertNull(createAndGetSubbingFor(null).get("10"));
    }

    @ParameterizedTest(name = "{0}")
    @CsvSource({
            "replaced player is on the other team, 10, 5",
            "replaced player also played, 10, 3",
            "key isn't a sub, 0, 4",
            "key isn't in the match, 4, 3",
    })
    void refusesSubbingForThatDoesNotFit(String why, String sub, String replaced) {
        stubPlayers();

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.create(request(Map.of(sub, replaced))));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
        verify(matches, never()).save(any());
    }

    // Disabled behaviour 13
    @Test
    void refusesAMatchWithADisabledPlayer() {
        stubPlayers();
        everyone.get(5).setDisabledAt(LocalDateTime.now());

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.create(request()));

        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
        verify(matches, never()).save(any());
    }

    @Test
    void onlyAnActiveSeasonTakesMatches() {
        season.setStatus(SeasonStatus.COMPLETED);
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.create(request()));
        assertEquals(HttpStatus.CONFLICT, e.getStatusCode());
        verifyNoInteractions(elo);
    }

    @Test
    void refusesTwoSubsStandingInForTheSamePlayer() {
        stubPlayers();
        CreateMatchRequest request = new CreateMatchRequest(8652158100L, season.getId(), LocalDateTime.now().minusDays(1),
                radiant.getTeamId(), dire.getTeamId(), Side.RADIANT, List.of("0", "1", "2", "10", "11"),
                List.of("5", "6", "7", "8", "9"), Map.of("10", "4", "11", "4"));

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.create(request));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
        verify(matches, never()).save(any());
    }

    @Test
    void addingAndDeletingMovesStandingsAndReplaysElo() {
        stubPlayers();
        CreateMatchRequest request = request();

        service.create(request);

        ArgumentCaptor<Match> saved = ArgumentCaptor.forClass(Match.class);
        InOrder order = inOrder(elo, matches);
        order.verify(elo).rewind(request.playedTime());
        order.verify(matches).save(saved.capture());
        order.verify(elo).replay(request.playedTime());
        Match match = saved.getValue();
        assertEquals(List.of(false, false, false, false, true, false, false, false, false, false),
                match.getParticipants().stream().map(MatchParticipant::isSub).toList());
        assertEquals(1, radiant.getWins());
        assertEquals(1, dire.getLosses());

        // Rewound before the delete, while the match's ELO history still says what it did
        when(matches.findById(match.getMatchId())).thenReturn(Optional.of(match));
        service.delete(match.getMatchId());

        order.verify(elo).rewind(request.playedTime());
        order.verify(matches).delete(match);
        order.verify(elo).replay(request.playedTime());
        assertEquals(0, radiant.getWins());
        assertEquals(0, dire.getLosses());
    }

    // Standings going into a match, in the league season below

    // Stored W/L, as the standings hold them today
    private Team leagueTeam(int wins, int losses) {
        Team team = new Team();
        team.setTeamId(UUID.randomUUID());
        team.setSeason(league);
        team.setWins(wins);
        team.setLosses(losses);
        league.getTeams().add(team);
        return team;
    }

    private Match leagueMatch(long matchId, LocalDateTime played, Team radiant, Team dire, Side winner) {
        Match match = new Match();
        match.setMatchId(matchId);
        match.setPlayedTime(played);
        match.setSeason(league);
        match.setRadiantTeam(radiant);
        match.setDireTeam(dire);
        match.setMatchWinner(winner);
        match.setParticipants(new ArrayList<>());
        return match;
    }

    private MatchDetailResponse getMatch(Match match, Match... leagueMatches) {
        when(matches.findById(match.getMatchId())).thenReturn(Optional.of(match));
        when(matches.findBySeasonIdOrderByPlayedTimeDesc(league.getId(), Limit.unlimited())).thenReturn(List.of(leagueMatches));
        return service.getMatch(match.getMatchId());
    }

    @Test
    void standingsLeaveOutThisMatchAndEveryLaterOne() {
        Team alpha = leagueTeam(3, 2);
        Team bravo = leagueTeam(2, 3);
        Team charlie = leagueTeam(2, 2);
        Match earlier = leagueMatch(100, NOON.minusDays(1), alpha, bravo, Side.RADIANT);
        // Same time as this match but a lower ID, so the ELO replay puts it first
        Match sameTimeEarlier = leagueMatch(150, NOON, charlie, bravo, Side.RADIANT);
        Match thisMatch = leagueMatch(200, NOON, alpha, bravo, Side.DIRE);
        Match sameTimeLater = leagueMatch(300, NOON, charlie, alpha, Side.RADIANT);
        Match nextDay = leagueMatch(50, NOON.plusDays(1), bravo, charlie, Side.RADIANT);

        MatchDetailResponse detail = getMatch(thisMatch, nextDay, sameTimeLater, thisMatch, sameTimeEarlier, earlier);

        // Alpha loses this match and the later one; Bravo wins this match and the next day's; Charlie wins one later and loses one
        assertEquals(new TeamStandingResponse(1, 3, 3, 0), detail.radiantStanding());
        assertEquals(new TeamStandingResponse(3, 3, 0, 3), detail.direStanding());
    }

    @Test
    void tiedTeamsKeepTheSeasonTableOrder() {
        Team xray = leagueTeam(1, 2);
        leagueTeam(1, 1);
        Team zulu = leagueTeam(2, 1);
        Match thisMatch = leagueMatch(200, NOON, zulu, xray, Side.RADIANT);

        MatchDetailResponse detail = getMatch(thisMatch, thisMatch);

        // All three go in at 1W 1L
        assertEquals(new TeamStandingResponse(3, 3, 1, 1), detail.radiantStanding());
        assertEquals(new TeamStandingResponse(1, 3, 1, 1), detail.direStanding());
    }

    @Test
    void inhouseHasNoStandings() {
        Match inhouse = new Match();
        inhouse.setMatchId(400L);
        inhouse.setPlayedTime(NOON);
        inhouse.setMatchWinner(Side.RADIANT);
        inhouse.setParticipants(new ArrayList<>());
        when(matches.findById(400L)).thenReturn(Optional.of(inhouse));

        MatchDetailResponse detail = service.getMatch(400L);

        assertNull(detail.radiantStanding());
        assertNull(detail.direStanding());
    }

    // An in-house where each player's ELO going in is given, or null for a player with no ELO record
    private Match inhouseWithElo(Double... eloBefore) {
        Match match = new Match();
        match.setMatchId(500L);
        match.setPlayedTime(NOON);
        match.setMatchWinner(Side.RADIANT);
        match.setParticipants(new ArrayList<>());
        List<EloHistory> rows = new ArrayList<>();
        for (int i = 0; i < eloBefore.length; i++) {
            MatchParticipant participant = new MatchParticipant();
            participant.setMatch(match);
            participant.setPlayer(everyone.get(i));
            participant.setSide(i < eloBefore.length / 2 ? Side.RADIANT : Side.DIRE);
            match.getParticipants().add(participant);
            if (eloBefore[i] == null) continue;
            EloHistory row = new EloHistory();
            row.setPlayer(everyone.get(i));
            row.setMatch(match);
            // History stores the ELO after the match
            row.setEloChange(10);
            row.setElo(eloBefore[i] + 10);
            rows.add(row);
        }
        when(matches.findById(500L)).thenReturn(Optional.of(match));
        when(eloHistory.findByMatchMatchId(500L)).thenReturn(rows);
        return match;
    }

    @Test
    void winChanceUsesTheEloReplaysFormula() {
        // Radiant averages 1600 going in, Dire 1500
        inhouseWithElo(1650.0, 1550.0, 1600.0, 1600.0, 1600.0, 1500.0, 1500.0, 1500.0, 1500.0, 1500.0);

        assertEquals(1 / (1 + Math.pow(10, -100.0 / 400)), service.getMatch(500L).radiantWinChance(), 1e-9);
    }

    @Test
    void noWinChanceWhenAPlayerHasNoEloRecord() {
        inhouseWithElo(1650.0, null, 1600.0, 1600.0, 1600.0, 1500.0, 1500.0, 1500.0, 1500.0, 1500.0);

        assertNull(service.getMatch(500L).radiantWinChance());
    }

    @Test
    void noWinChanceWithoutAllTenPlayers() {
        inhouseWithElo(1650.0, 1550.0, 1500.0, 1500.0);

        assertNull(service.getMatch(500L).radiantWinChance());
    }

    @Test
    void getAllMatchesAsksTheDatabaseForOnlyTheLimit() {
        when(matches.findAllByOrderByPlayedTimeDesc(any())).thenReturn(List.of());

        service.getAllMatches(null, 6);
        service.getAllMatches(null, null);

        verify(matches).findAllByOrderByPlayedTimeDesc(Limit.of(6));
        verify(matches).findAllByOrderByPlayedTimeDesc(Limit.unlimited());
    }

    @Test
    void getAllMatchesLimitsASeasonsMatchesToo() {
        UUID seasonId = UUID.randomUUID();
        when(matches.findBySeasonIdOrderByPlayedTimeDesc(any(), any(Limit.class))).thenReturn(List.of());

        service.getAllMatches(seasonId, 6);

        verify(matches).findBySeasonIdOrderByPlayedTimeDesc(seasonId, Limit.of(6));
    }

    @Test
    void getAllMatchesRejectsALimitBelowOne() {
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.getAllMatches(null, 0));
        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
    }

    // Forfeits: the dire team didn't show, so it's the forfeiting team

    private CreateForfeitRequest forfeit() {
        return new CreateForfeitRequest(season.getId(), LocalDateTime.now().minusDays(1), dire.getTeamId(), radiant.getTeamId());
    }

    private Match recordForfeit() {
        return recordForfeit(forfeit());
    }

    private Match recordForfeit(CreateForfeitRequest request) {
        stubPlayers();
        service.createForfeit(request);
        ArgumentCaptor<Match> saved = ArgumentCaptor.forClass(Match.class);
        verify(matches).save(saved.capture());
        return saved.getValue();
    }

    // Forfeit behaviour 1: the forfeiting team on Radiant, losing, with both full rosters and no subs
    @Test
    void forfeitRecordsBothRostersWithTheForfeitingTeamLosing() {
        CreateForfeitRequest request = forfeit();

        Match match = recordForfeit(request);

        assertTrue(match.isForfeit());
        assertSame(season, match.getSeason());
        assertEquals(request.playedTime(), match.getPlayedTime());
        assertSame(dire, match.getRadiantTeam());
        assertSame(radiant, match.getDireTeam());
        assertEquals(Side.DIRE, match.getMatchWinner());
        assertEquals(List.of("5", "6", "7", "8", "9"), match.getParticipants().stream()
                .filter(p -> p.getSide() == Side.RADIANT).map(p -> p.getPlayer().getSteamId()).toList());
        assertEquals(List.of("0", "1", "2", "3", "4"), match.getParticipants().stream()
                .filter(p -> p.getSide() == Side.DIRE).map(p -> p.getPlayer().getSteamId()).toList());
        assertTrue(match.getParticipants().stream().noneMatch(MatchParticipant::isSub));
    }

    // Forfeit behaviour 2: no Dota game, so the ID is made up below anything stored
    @ParameterizedTest
    @CsvSource(value = {"NULL, -1", "8652158100, -1", "-4, -5"}, nullValues = "NULL")
    void forfeitGetsAnIdBelowTheLowestStored(Long lowest, long expected) {
        when(matches.lowestMatchId()).thenReturn(lowest);

        assertEquals(expected, recordForfeit().getMatchId());
    }

    // A binned forfeit keeps its ID, so a new one can't take it and wipe it from the bin
    @ParameterizedTest
    @CsvSource(value = {"NULL, -3, -4", "-2, -5, -6", "-7, -5, -8"}, nullValues = "NULL")
    void forfeitIdSkipsTheBin(Long lowestRecorded, Long lowestBinned, long expected) {
        when(matches.lowestMatchId()).thenReturn(lowestRecorded);
        when(bin.lowestMatchId()).thenReturn(lowestBinned);

        assertEquals(expected, recordForfeit().getMatchId());
    }

    // The bin says which are forfeits, as their IDs are made up
    @Test
    void binSaysWhichAreForfeits() {
        DeletedMatch copy = binned();
        copy.setForfeit(true);
        when(bin.findBySeasonIdOrderByDeletedAtDesc(season.getId())).thenReturn(List.of(copy));

        assertTrue(service.getBin(season.getId()).get(0).forfeit());
    }

    // Forfeit behaviour 3
    @Test
    void forfeitCountsInTheSeasonTable() {
        recordForfeit();

        assertEquals(1, dire.getLosses());
        assertEquals(0, dire.getWins());
        assertEquals(1, radiant.getWins());
        assertEquals(0, radiant.getLosses());
    }

    // Forfeit behaviour 4: the same rules as adding a match
    @Test
    void forfeitOnlyInAnActiveSeason() {
        stubPlayers();
        season.setStatus(SeasonStatus.COMPLETED);

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.createForfeit(forfeit()));

        assertEquals(HttpStatus.CONFLICT, e.getStatusCode());
        verify(matches, never()).save(any());
    }

    @Test
    void forfeitRefusesATeamFromElsewhere() {
        stubPlayers();
        CreateForfeitRequest request = new CreateForfeitRequest(season.getId(), LocalDateTime.now().minusDays(1), UUID.randomUUID(), radiant.getTeamId());

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.createForfeit(request));

        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
        verify(matches, never()).save(any());
    }

    @Test
    void forfeitRefusesATeamAgainstItself() {
        stubPlayers();
        CreateForfeitRequest request = new CreateForfeitRequest(season.getId(), LocalDateTime.now().minusDays(1), dire.getTeamId(), dire.getTeamId());

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.createForfeit(request));

        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
        verify(matches, never()).save(any());
    }

    @ParameterizedTest
    @CsvSource({"-15", "1"})
    void forfeitRefusesATimeOutsideTheSeason(int daysFromNow) {
        stubPlayers();
        CreateForfeitRequest request = new CreateForfeitRequest(season.getId(), LocalDateTime.now().plusDays(daysFromNow), dire.getTeamId(), radiant.getTeamId());

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.createForfeit(request));

        assertEquals(HttpStatus.BAD_REQUEST, e.getStatusCode());
        verify(matches, never()).save(any());
    }

    // Forfeit behaviour 7
    @Test
    void listsAndDetailSayItsAForfeit() {
        Match match = activeSeasonMatch();
        match.setForfeit(true);
        when(matches.findAllByOrderByPlayedTimeDesc(any())).thenReturn(List.of(match));
        when(matches.findBySeasonIdOrderByPlayedTimeDesc(season.getId(), Limit.unlimited())).thenReturn(List.of());

        assertTrue(service.getAllMatches(null, null).get(0).forfeit());
        assertTrue(service.getMatch(8652158100L).match().forfeit());
    }

    // Forfeit behaviour 9: binned as a forfeit, and restored as one under the same ID
    @Test
    void deletedForfeitComesBackAsAForfeit() {
        Match match = activeSeasonMatch();
        match.setForfeit(true);

        service.delete(8652158100L);

        ArgumentCaptor<DeletedMatch> binnedCopy = ArgumentCaptor.forClass(DeletedMatch.class);
        verify(bin).save(binnedCopy.capture());
        assertTrue(binnedCopy.getValue().isForfeit());

        // Both full rosters, as a forfeit records them
        DeletedMatch copy = binned();
        copy.setForfeit(true);
        copy.setParticipants(IntStream.range(0, 10).mapToObj(i -> {
            DeletedMatch.DeletedParticipant p = new DeletedMatch.DeletedParticipant();
            p.setSteamId(String.valueOf(i));
            p.setSide(i < 5 ? Side.RADIANT : Side.DIRE);
            return p;
        }).toList());
        stubPlayers();

        service.restore(8652158100L);

        ArgumentCaptor<Match> restored = ArgumentCaptor.forClass(Match.class);
        verify(matches).save(restored.capture());
        assertTrue(restored.getValue().isForfeit());
        assertEquals(8652158100L, restored.getValue().getMatchId());
    }
}
