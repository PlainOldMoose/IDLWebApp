package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
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

        // The winner has to be one of this season's teams
        assertThrows(ResponseStatusException.class, () -> service.completeSeason(seasonId, UUID.randomUUID()));
        assertEquals(SeasonStatus.ACTIVE, season.getStatus());

        service.completeSeason(seasonId, champions.getTeamId());
        assertSame(champions, season.getWinner());
        assertEquals(SeasonStatus.COMPLETED, season.getStatus());

        // One-way: a completed season's winner can't be changed
        assertThrows(ResponseStatusException.class, () -> service.completeSeason(seasonId, champions.getTeamId()));
    }
}
