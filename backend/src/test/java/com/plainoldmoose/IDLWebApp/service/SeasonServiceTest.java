package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.team.TeamResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class SeasonServiceTest {

    private final UUID seasonId = UUID.randomUUID();
    private final Season season = new Season();
    private final SeasonService service =
            new SeasonService(mock(SeasonRepository.class, inv -> Optional.of(season)), mock(MatchRepository.class));

    @Test
    void completeSeason() {
        Team champions = new Team();
        champions.setTeamId(UUID.randomUUID());
        season.setTeams(List.of(champions));
        season.setStatus(SeasonStatus.ACTIVE);

        assertThrows(ResponseStatusException.class, () -> service.completeSeason(seasonId, UUID.randomUUID()));
        assertEquals(SeasonStatus.ACTIVE, season.getStatus());

        service.completeSeason(seasonId, champions.getTeamId());
        assertSame(champions, season.getWinner());
        assertEquals(SeasonStatus.COMPLETED, season.getStatus());

        assertThrows(ResponseStatusException.class, () -> service.completeSeason(seasonId, champions.getTeamId()));
    }

    private static Team team(String name, int wins, int losses) {
        Player captain = new Player();
        captain.setUsername(name + " captain");
        Team team = new Team();
        team.setTeamId(UUID.randomUUID());
        team.setName(name);
        team.setCaptain(captain);
        team.setWins(wins);
        team.setLosses(losses);
        return team;
    }

    @Test
    void detailListsTeamsInTableOrder() {
        // Most wins first, then fewest losses
        season.setTeams(List.of(team("Bottom", 1, 3), team("Top", 3, 0), team("Second", 2, 1), team("Third", 2, 2)));

        assertEquals(List.of("Top", "Second", "Third", "Bottom"),
                service.getSeasonById(seasonId).teams().stream().map(TeamResponse::name).toList());
    }
}
