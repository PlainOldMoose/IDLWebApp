package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
    void eloChange() {
        assertEquals(16.0, InhouseService.eloChange(1500, 1500, Side.RADIANT));
        assertEquals(-16.0, InhouseService.eloChange(1500, 1500, Side.DIRE));
        // A 200 point favourite expects to win 76% of the time, so beating them is worth more than winning as them
        assertEquals(7.7, InhouseService.eloChange(1700, 1500, Side.RADIANT));
        assertEquals(24.3, InhouseService.eloChange(1500, 1700, Side.RADIANT));
    }
}
