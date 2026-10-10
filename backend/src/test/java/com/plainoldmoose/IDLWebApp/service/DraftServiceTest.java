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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DraftServiceTest {

    private final UUID seasonId = UUID.randomUUID();
    private final Season season = new Season();
    private final TeamRepository teams = mock(TeamRepository.class);
    private final DraftService service = new DraftService(mock(SeasonRepository.class, inv -> Optional.of(season)), teams);
    private LocalDateTime clock = LocalDateTime.of(2026, 1, 1, 12, 0);

    @BeforeEach
    void setUp() {
        season.setSignups(new ArrayList<>());
        season.setTeams(new ArrayList<>());
        when(teams.save(any())).thenAnswer(inv -> {
            Team team = inv.getArgument(0);
            team.setTeamId(UUID.randomUUID());
            return team;
        });
    }

    // Signed up a minute after the last one
    private SeasonSignup signUp(String name, double elo, boolean captain, boolean sub) {
        Player player = new Player();
        player.setSteamId(name);
        player.setUsername(name);
        player.setElo(elo);
        SeasonSignup signup = new SeasonSignup();
        signup.setSeason(season);
        signup.setPlayer(player);
        signup.setRolePreference(sub ? null : "any");
        signup.setWillingToCaptain(captain);
        signup.setSub(sub);
        clock = clock.plusMinutes(1);
        signup.setSignedUpAt(clock);
        season.getSignups().add(signup);
        return signup;
    }

    // Already scored, as after sign-ups close
    private SeasonSignup drafted(String name, double elo, int score) {
        SeasonSignup signup = signUp(name, elo, false, false);
        signup.setDraftScore(score);
        return signup;
    }

    private Team team(SeasonSignup captain, SeasonSignup... picks) {
        Team team = new Team();
        team.setTeamId(UUID.randomUUID());
        team.setSeason(season);
        team.setName(captain.getPlayer().getUsername() + "'s team");
        team.setCaptain(captain.getPlayer());
        for (SeasonSignup member : concat(captain, picks)) {
            TeamMember teamMember = new TeamMember();
            teamMember.setTeam(team);
            teamMember.setPlayer(member.getPlayer());
            team.getMembers().add(teamMember);
        }
        season.getTeams().add(team);
        return team;
    }

    private static List<SeasonSignup> concat(SeasonSignup first, SeasonSignup... rest) {
        List<SeasonSignup> all = new ArrayList<>(List.of(first));
        all.addAll(List.of(rest));
        return all;
    }

    private void drafting() {
        season.setStatus(SeasonStatus.DRAFTING);
    }

    private static int status(Executable call) {
        return assertThrows(ResponseStatusException.class, call).getStatusCode().value();
    }

    private static List<String> names(List<DraftPlayerResponse> players) {
        return players.stream().map(DraftPlayerResponse::username).toList();
    }

    private static List<String> memberNames(Team team) {
        return team.getMembers().stream().map(member -> member.getPlayer().getUsername()).toList();
    }

    private DraftTeamResponse teamNamed(DraftResponse draft, String name) {
        return draft.teams().stream().filter(team -> team.name().equals(name)).findFirst().orElseThrow();
    }

    // Ten players, 2000 down to 1100 ELO, in sign-up order
    private List<SeasonSignup> tenPlayers(String... captains) {
        List<SeasonSignup> players = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            String name = String.valueOf((char) ('a' + i));
            players.add(signUp(name, 2000 - i * 100, List.of(captains).contains(name), false));
        }
        return players;
    }

    @Test
    void draftScoreMatchesSeason45() {
        // Cutoff is the 9th lowest ELO of the 45 drafted (9 teams), lowest is Vornabar's
        double cutoff = 1361.04202, lowest = 984.2745971;
        assertEquals(1100, DraftService.draftScore(2220.56, cutoff, lowest)); // Matt (chomp) Amos
        assertEquals(830, DraftService.draftScore(1950.85, cutoff, lowest)); // Moose
        assertEquals(240, DraftService.draftScore(1361.04, cutoff, lowest)); // Nelson, the cutoff
        assertEquals(210, DraftService.draftScore(1323.36, cutoff, lowest)); // Goldrion
        assertEquals(10, DraftService.draftScore(1073.18, cutoff, lowest)); // bernard humperdink
        assertEquals(-61, DraftService.draftScore(984.27, cutoff, lowest)); // Vornabar, the lowest
    }

    @Test
    void closingSignupsScoresTheDraftedPlayers() {
        List<SeasonSignup> players = tenPlayers("a", "b");

        service.closeSignups(seasonId);

        assertEquals(SeasonStatus.DRAFTING, season.getStatus());
        // Two teams, so the cutoff is the 2nd lowest ELO (1200) and the lowest is 1100
        for (SeasonSignup player : players) {
            assertEquals(DraftService.draftScore(player.getPlayer().getElo(), 1200, 1100), player.getDraftScore());
        }
        assertEquals(819, players.get(0).getDraftScore());
        assertEquals(19, players.get(8).getDraftScore());
        assertEquals(-61, players.get(9).getDraftScore());
    }

    @Test
    void subsAndOverflowArentScored() {
        List<SeasonSignup> players = tenPlayers("a", "b");
        SeasonSignup sub = signUp("sub", 500, false, true);
        SeasonSignup overflow = signUp("late", 600, false, false);

        service.closeSignups(seasonId);

        assertNull(sub.getDraftScore());
        assertNull(overflow.getDraftScore());
        // The cutoff and lowest still come from the ten drafted players only
        assertEquals(-61, players.get(9).getDraftScore());
    }

    @Test
    void firstWillingCaptainsGetTeams() {
        tenPlayers("c", "e", "h");

        service.closeSignups(seasonId);

        assertEquals(List.of("c", "e"), season.getTeams().stream().map(team -> team.getCaptain().getUsername()).sorted().toList());
        Team cTeam = season.getTeams().stream().filter(team -> team.getCaptain().getUsername().equals("c")).findFirst().orElseThrow();
        assertEquals("c's team", cTeam.getName());
        assertEquals(List.of("c"), memberNames(cTeam));
        verify(teams, times(2)).save(any());

        // The third willing captain is drafted like anyone else
        assertEquals(true, names(service.getDraft(seasonId).pool()).contains("h"));
    }

    @Test
    void closingNeedsOpenSignupsAndTwoTeams() {
        for (int i = 0; i < 9; i++) signUp("p" + i, 1500, i < 2, false);
        assertEquals(409, status(() -> service.closeSignups(seasonId)));

        signUp("p9", 1500, false, false);
        season.setStatus(SeasonStatus.ACTIVE);
        assertEquals(409, status(() -> service.closeSignups(seasonId)));
    }

    @Test
    void poolIsEveryoneNotOnATeamHighestScoreFirst() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 300);
        SeasonSignup y = drafted("y", 1500, 100);
        SeasonSignup picked = drafted("picked", 1500, 900);
        for (int i = 0; i < 7; i++) drafted("p" + i, 1500, i * 10);
        signUp("sub", 1500, false, true);
        team(x, picked);
        team(y);

        DraftResponse draft = service.getDraft(seasonId);

        assertEquals(List.of("p6", "p5", "p4", "p3", "p2", "p1", "p0"), names(draft.pool()));
        assertEquals(2, draft.teamCount());
        assertEquals(1200, teamNamed(draft, "x's team").draftScore());
        assertEquals(100, teamNamed(draft, "y's team").draftScore());
        assertEquals("x", teamNamed(draft, "x's team").captainSteamId());
        assertEquals(List.of("x", "picked"), names(teamNamed(draft, "x's team").members()));
    }

    @Test
    void lowestTotalIsOnTheClock() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 300);
        SeasonSignup y = drafted("y", 1500, 100);
        for (int i = 0; i < 8; i++) drafted("p" + i, 1500, 50);
        team(x);
        Team yTeam = team(y);

        assertEquals(yTeam.getTeamId(), service.getDraft(seasonId).onTheClockTeamId());
    }

    @Test
    void tiedTotalsGoToTheLowerCaptain() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 300);
        SeasonSignup y = drafted("y", 1500, 100);
        SeasonSignup xPick = drafted("xPick", 1500, 200);
        SeasonSignup yPick = drafted("yPick", 1500, 400);
        for (int i = 0; i < 6; i++) drafted("p" + i, 1500, 50);
        team(x, xPick);
        Team yTeam = team(y, yPick);

        assertEquals(yTeam.getTeamId(), service.getDraft(seasonId).onTheClockTeamId());
    }

    @Test
    void fullTeamsAreSkipped() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 10);
        SeasonSignup y = drafted("y", 1500, 900);
        List<SeasonSignup> xPicks = new ArrayList<>();
        for (int i = 0; i < 4; i++) xPicks.add(drafted("x" + i, 1500, 10));
        for (int i = 0; i < 4; i++) drafted("p" + i, 1500, 50);
        team(x, xPicks.toArray(SeasonSignup[]::new));
        Team yTeam = team(y);

        assertEquals(yTeam.getTeamId(), service.getDraft(seasonId).onTheClockTeamId());
    }

    @Test
    void noPicksUntilEveryTeamHasACaptain() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 300);
        for (int i = 0; i < 9; i++) drafted("p" + i, 1500, 50);
        team(x);

        assertNull(service.getDraft(seasonId).onTheClockTeamId());
        assertEquals(409, status(() -> service.pick(seasonId, "p0", "x", false)));
    }

    @Test
    void adminMakesAndRemovesCaptainsBeforeTheFirstPick() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 300);
        for (int i = 0; i < 9; i++) drafted("p" + i, 1500, 50);
        team(x);

        service.makeCaptain(seasonId, "p0");

        Team p0Team = season.getTeams().stream().filter(team -> team.getCaptain().getUsername().equals("p0")).findFirst().orElseThrow();
        assertEquals("p0's team", p0Team.getName());
        assertEquals(List.of("p0"), memberNames(p0Team));
        assertEquals(false, names(service.getDraft(seasonId).pool()).contains("p0"));
        // Two teams, two captains
        assertEquals(409, status(() -> service.makeCaptain(seasonId, "p1")));

        service.removeCaptain(seasonId, "x");

        verify(teams).delete(any());
        assertEquals(1, season.getTeams().size());
        assertEquals(true, names(service.getDraft(seasonId).pool()).contains("x"));
    }

    @Test
    void captainsAreFixedOnceThePicksStart() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 300);
        SeasonSignup y = drafted("y", 1500, 100);
        SeasonSignup picked = drafted("picked", 1500, 50);
        for (int i = 0; i < 7; i++) drafted("p" + i, 1500, 50);
        team(x);
        team(y, picked);

        assertEquals(409, status(() -> service.removeCaptain(seasonId, "x")));
        assertEquals(409, status(() -> service.makeCaptain(seasonId, "p0")));
    }

    @Test
    void captainOnTheClockOrAnAdminPicks() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 100);
        SeasonSignup y = drafted("y", 1500, 500);
        for (int i = 0; i < 8; i++) drafted("p" + i, 1500, 50);
        Team xTeam = team(x);
        team(y);

        assertEquals(403, status(() -> service.pick(seasonId, "p0", "y", false)));
        assertEquals(403, status(() -> service.pick(seasonId, "p0", "p1", false)));

        service.pick(seasonId, "p0", "x", false);
        assertEquals(List.of("x", "p0"), memberNames(xTeam));

        // x is on 150 now, still under y's 500; the admin picks for x
        service.pick(seasonId, "p1", "someAdmin", true);
        assertEquals(List.of("x", "p0", "p1"), memberNames(xTeam));
        assertEquals(false, names(service.getDraft(seasonId).pool()).contains("p1"));
    }

    @Test
    void onlyPoolPlayersCanBePicked() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 100);
        SeasonSignup y = drafted("y", 1500, 500);
        for (int i = 0; i < 8; i++) drafted("p" + i, 1500, 50);
        signUp("sub", 1500, false, true);
        team(x);
        team(y);

        assertEquals(409, status(() -> service.pick(seasonId, "y", "x", false)));
        assertEquals(409, status(() -> service.pick(seasonId, "sub", "x", false)));
        assertEquals(409, status(() -> service.pick(seasonId, "nobody", "x", false)));
    }

    // One pick left: x has 4 of 5, y is full
    private Team[] oneLeft() {
        drafting();
        SeasonSignup x = drafted("x", 1000, 100);
        SeasonSignup y = drafted("y", 2000, 900);
        List<SeasonSignup> xPicks = new ArrayList<>(), yPicks = new ArrayList<>();
        for (int i = 0; i < 3; i++) xPicks.add(drafted("x" + i, 1500, 10));
        for (int i = 0; i < 4; i++) yPicks.add(drafted("y" + i, 1501, 10));
        drafted("last", 1001, 10);
        return new Team[]{team(x, xPicks.toArray(SeasonSignup[]::new)), team(y, yPicks.toArray(SeasonSignup[]::new))};
    }

    @Test
    void lastPickLeavesTheSeasonForAnAdminToStart() {
        Team xTeam = oneLeft()[0];

        service.pick(seasonId, "last", "x", false);

        assertEquals(5, xTeam.getMembers().size());
        assertEquals(SeasonStatus.DRAFTING, season.getStatus());
        DraftResponse draft = service.getDraft(seasonId);
        assertEquals(List.of(), draft.pool());
        assertNull(draft.onTheClockTeamId());

        // Captains can still name their teams before the season starts
        service.renameTeam(seasonId, xTeam.getTeamId(), "The Olyssey", "x", false);
        assertEquals("The Olyssey", xTeam.getName());
    }

    @Test
    void startingTheSeasonNeedsEveryTeamFull() {
        Team[] teams = oneLeft();

        assertEquals(409, status(() -> service.startSeason(seasonId)));
        assertEquals(SeasonStatus.DRAFTING, season.getStatus());

        service.pick(seasonId, "last", "x", false);
        service.startSeason(seasonId);

        assertEquals(SeasonStatus.ACTIVE, season.getStatus());
        // (1000 + 3 * 1500 + 1001) / 5 = 1300.2; (2000 + 4 * 1501) / 5 = 1600.8
        assertEquals(1300, teams[0].getAvgElo());
        assertEquals(1601, teams[1].getAvgElo());
        assertEquals(409, status(() -> service.startSeason(seasonId)));
    }

    @Test
    void captainOrAdminRenamesTheTeam() {
        drafting();
        SeasonSignup x = drafted("x", 1500, 100);
        SeasonSignup y = drafted("y", 1500, 500);
        for (int i = 0; i < 8; i++) drafted("p" + i, 1500, 50);
        Team xTeam = team(x);
        team(y);

        service.renameTeam(seasonId, xTeam.getTeamId(), "The Olyssey", "x", false);
        assertEquals("The Olyssey", xTeam.getName());

        service.renameTeam(seasonId, xTeam.getTeamId(), "Scheme Theater", "someAdmin", true);
        assertEquals("Scheme Theater", xTeam.getName());

        assertEquals(403, status(() -> service.renameTeam(seasonId, xTeam.getTeamId(), "Nope", "y", false)));
        assertEquals(404, status(() -> service.renameTeam(seasonId, UUID.randomUUID(), "Nope", "x", false)));

        season.setStatus(SeasonStatus.ACTIVE);
        assertEquals(409, status(() -> service.renameTeam(seasonId, xTeam.getTeamId(), "Late", "x", false)));
    }
}
