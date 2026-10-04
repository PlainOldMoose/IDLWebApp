package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.model.Inhouse;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.InhouseRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class InhouseServiceTest {

    private static double sum(List<Player> team) {
        return team.stream().mapToDouble(Player::getElo).sum();
    }

    @Test
    void balance() {
        // Total 14600, and 1000 + 2000 + 1800 + 1400 + 1100 = 7300 is exactly half
        List<Player> players = Stream.of(1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 2000)
                .map(elo -> {
                    Player player = new Player();
                    player.setElo(elo);
                    return player;
                })
                .toList();

        List<List<Player>> options = InhouseService.balance(players);

        assertEquals(3, options.size());
        double previousGap = -1;
        for (List<Player> radiant : options) {
            assertEquals(5, new HashSet<>(radiant).size());
            assertTrue(radiant.contains(players.get(0)));
            double gap = Math.abs(14600 - 2 * sum(radiant));
            assertTrue(gap >= previousGap, "options run from most to least even");
            previousGap = gap;
        }
        assertEquals(7300, sum(options.get(0)));
    }

    @Test
    void resultWaitsForAnAdmin() {
        InhouseRepository inhouses = mock(InhouseRepository.class);
        MatchRepository matches = mock(MatchRepository.class);
        // A real EloService over mocks that know no other games or seasons, so it replays just this one
        InhouseService service = new InhouseService(inhouses, mock(PlayerRepository.class), matches,
                new EloService(matches, mock(EloHistoryRepository.class), mock(SeasonRepository.class)));
        // Players 0-4 on Team A, 5-9 on Team B, all on 1500
        Inhouse inhouse = new Inhouse();
        inhouse.setId(1L);
        inhouse.setCreatedAt(LocalDateTime.now());
        IntStream.range(0, 10).forEach(i -> {
            Player player = new Player();
            player.setSteamId(String.valueOf(i));
            player.setElo(1500);
            (i < 5 ? inhouse.getTeamA() : inhouse.getTeamB()).add(player);
        });
        when(inhouses.findById(1L)).thenReturn(Optional.of(inhouse));

        // Team A played Dire and Radiant won, so Team B won
        service.reportResult(1L, Side.DIRE, Side.RADIANT, "0", false);
        assertEquals(Side.RADIANT, inhouse.getReportedWinner());
        verifyNoInteractions(matches);
        assertEquals(1500.0, inhouse.getTeamA().get(0).getElo());

        // The losing team can't cancel it or flip it before an admin looks
        assertThrows(ResponseStatusException.class, () -> service.cancel(1L, "1", false));
        assertThrows(ResponseStatusException.class, () -> service.reportResult(1L, Side.RADIANT, Side.DIRE, "1", false));

        List<Match> saved = new ArrayList<>();
        when(matches.save(any())).thenAnswer(inv -> {
            saved.add(inv.getArgument(0));
            return inv.getArgument(0);
        });
        when(matches.findByPlayedTimeGreaterThanEqualOrderByPlayedTimeAscMatchIdAsc(any())).thenReturn(saved);
        service.approve(1L);
        // Only right if Team B was stored as Radiant. New players with no games: K = 1.84, so 1.84 × 7.5 × 0.5
        assertEquals(1506.9, inhouse.getTeamB().get(0).getElo());
        assertEquals(1493.1, inhouse.getTeamA().get(0).getElo());
        verify(inhouses).delete(inhouse);
    }
}
