package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class EloServiceTest {

    @Test
    void k() {
        // K × S from the sheet's Match Data for two Season 41 games, with S = 15
        // EdgarAF on 1950, 1888 a season earlier, 166 earlier games, 10 season games missed, none this season
        assertEquals(18.25, 15 * EloService.k(1950, 1888, 166, 10, 0), 0.05);
        // AndrewC on 2140, 2202 a season earlier, 97 earlier games, 6 missed
        assertEquals(18.87, 15 * EloService.k(2140, 2202, 97, 6, 0), 0.05);
        // A new player starts on double: 0.92 × 2
        assertEquals(1.84, EloService.k(1500, 1500, 0, 0, 0), 1e-9);
        // The formula as written is undefined after 2 missed games; this stays finite however long someone's away
        assertTrue(Double.isFinite(EloService.k(1500, 1400, 50, 1000, 0)));
    }

    @Test
    void eloChange() {
        assertEquals(7.5, EloService.eloChange(1, 15, 1500, 1500, true));
        assertEquals(-7.5, EloService.eloChange(1, 15, 1500, 1500, false));
        // A 200 point favourite expects to win 76% of the time, so beating them is worth more than winning as them
        assertEquals(3.6, EloService.eloChange(1, 15, 1700, 1500, true));
        assertEquals(11.4, EloService.eloChange(1, 15, 1500, 1700, true));
    }

    // A game added before one already played: rewinding undoes the later game, and replaying works it out again from
    // the ELO the added game left everyone on
    @Test
    void replayingAnEarlierGameRedoesTheLaterOne() {
        MatchRepository matches = mock(MatchRepository.class);
        EloHistoryRepository history = mock(EloHistoryRepository.class);
        EloService service = new EloService(matches, history, mock(SeasonRepository.class));

        // Players 0-4 on Radiant, 5-9 on Dire, in both games. Mocked game counts are all 0, so everyone's K is 1.84
        List<Player> players = IntStream.range(0, 10).mapToObj(i -> {
            Player player = new Player();
            player.setSteamId(String.valueOf(i));
            return player;
        }).toList();
        LocalDateTime now = LocalDateTime.now();
        Match added = match(1L, now.minusDays(2), Side.DIRE, players);
        Match later = match(2L, now.minusDays(1), Side.RADIANT, players);

        // The later in-house was recorded from an even start: 1.84 × 7.5 × 0.5 = 6.9 each way
        List<EloHistory> laterRows = players.stream().map(player -> {
            boolean radiant = Integer.parseInt(player.getSteamId()) < 5;
            player.setElo(radiant ? 1506.9 : 1493.1);
            EloHistory row = new EloHistory();
            row.setPlayer(player);
            row.setMatch(later);
            row.setElo(player.getElo());
            row.setEloChange(radiant ? 6.9 : -6.9);
            return row;
        }).toList();
        when(history.findByMatchPlayedTimeGreaterThanEqual(added.getPlayedTime())).thenReturn(laterRows);
        when(matches.findByPlayedTimeGreaterThanEqualOrderByPlayedTimeAscMatchIdAsc(added.getPlayedTime()))
                .thenReturn(List.of(added, later));

        service.rewind(added.getPlayedTime());
        verify(history).deleteAll(laterRows);
        assertEquals(1500.0, players.get(0).getElo());
        assertEquals(1500.0, players.get(9).getElo());

        service.replay(added.getPlayedTime());
        // Dire won the added game, 6.9 each way. Radiant then beat a side 13.8 above it: 1.84 × 7.5 × (1 − 0.48) = 7.2
        assertEquals(1500.3, players.get(0).getElo());
        assertEquals(1499.7, players.get(9).getElo());
        assertEquals(1500, later.getAvgElo());

        ArgumentCaptor<EloHistory> saved = ArgumentCaptor.forClass(EloHistory.class);
        verify(history, times(20)).save(saved.capture());
        EloHistory last = saved.getAllValues().get(19);
        assertSame(later, last.getMatch());
        assertEquals(later.getPlayedTime(), last.getTimestamp());
        assertEquals(-7.2, last.getEloChange());
    }

    // An in-house: no season, so S = 7.5
    private static Match match(long id, LocalDateTime played, Side winner, List<Player> players) {
        Match match = new Match();
        match.setMatchId(id);
        match.setPlayedTime(played);
        match.setMatchWinner(winner);
        match.setParticipants(new ArrayList<>());
        for (Player player : players) {
            MatchParticipant participant = new MatchParticipant();
            participant.setMatch(match);
            participant.setPlayer(player);
            participant.setSide(Integer.parseInt(player.getSteamId()) < 5 ? Side.RADIANT : Side.DIRE);
            match.getParticipants().add(participant);
        }
        return match;
    }
}
