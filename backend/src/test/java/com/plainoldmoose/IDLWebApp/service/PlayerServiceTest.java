package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerMatchResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PlayerServiceTest {

    private final PlayerRepository players = mock(PlayerRepository.class);
    private final PlayerService service = new PlayerService(players, mock(EloHistoryRepository.class));

    private final Player player = new Player();

    PlayerServiceTest() {
        player.setSteamId("76561197960265729");
        player.setUsername("Antab");
        player.setEloHistory(new ArrayList<>());
        player.setMatchParticipations(new ArrayList<>());
        when(players.findById(player.getSteamId())).thenReturn(Optional.of(player));
    }

    private Match playMatch(long id, LocalDateTime playedTime, Season season) {
        Match match = new Match();
        match.setMatchId(id);
        match.setPlayedTime(playedTime);
        match.setMatchWinner(Side.RADIANT);
        match.setSeason(season);
        MatchParticipant participant = new MatchParticipant();
        participant.setMatch(match);
        participant.setPlayer(player);
        participant.setSide(Side.RADIANT);
        player.getMatchParticipations().add(participant);
        return match;
    }

    // Behaviour 1
    @Test
    void returnsEveryPlayedMatchNewestFirst() {
        LocalDateTime start = LocalDateTime.of(2026, 1, 1, 20, 0);
        for (long i = 1; i <= 25; i++) playMatch(i, start.plusDays(i), null);
        playMatch(99, null, null);

        List<PlayerMatchResponse> matches = service.findById(player.getSteamId()).matches();

        assertEquals(25, matches.size());
        assertEquals(25L, matches.get(0).matchId());
        assertEquals(1L, matches.get(24).matchId());
    }

    // Behaviour 2
    @Test
    void carriesTheSeasonIdOfEachMatch() {
        Season season = new Season();
        season.setId(UUID.randomUUID());
        season.setName("Season 45");
        playMatch(1, LocalDateTime.of(2026, 1, 1, 20, 0), null);
        playMatch(2, LocalDateTime.of(2026, 1, 2, 20, 0), season);

        PlayerDetailResponse detail = service.findById(player.getSteamId());

        assertEquals(season.getId(), detail.matches().get(0).seasonId());
        assertNull(detail.matches().get(1).seasonId());
    }
}
