package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerMatchResponse;
import com.plainoldmoose.IDLWebApp.dto.response.player.PlayerSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonSignupRepository;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PlayerServiceTest {

    private final PlayerRepository players = mock(PlayerRepository.class);
    private final SeasonSignupRepository signups = mock(SeasonSignupRepository.class);
    private final PlayerService service = new PlayerService(players, mock(EloHistoryRepository.class), signups);

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

    // Forfeit behaviour 8: on the list with the right side's result, but not in W/L or win rate
    @Test
    void forfeitsAreListedButLeftOutOfTheRecord() {
        playMatch(1, LocalDateTime.of(2026, 1, 1, 20, 0), null);
        playMatch(2, LocalDateTime.of(2026, 1, 2, 20, 0), null).setForfeit(true);
        Match lost = playMatch(3, LocalDateTime.of(2026, 1, 3, 20, 0), null);
        lost.setForfeit(true);
        lost.setMatchWinner(Side.DIRE);

        PlayerDetailResponse detail = service.findById(player.getSteamId());

        assertEquals(1, detail.wins());
        assertEquals(0, detail.losses());
        assertEquals(100.0, detail.winRate());
        assertEquals(List.of(3L, 2L, 1L), detail.matches().stream().map(PlayerMatchResponse::matchId).toList());
        assertEquals(List.of(true, true, false), detail.matches().stream().map(PlayerMatchResponse::forfeit).toList());
        assertEquals(List.of(false, true, true), detail.matches().stream().map(PlayerMatchResponse::won).toList());
    }

    // Disabled behaviour 1
    @Test
    void disablingMarksThePlayerDisabledFromNow() {
        LocalDateTime before = LocalDateTime.now();

        service.disable(player.getSteamId());

        assertTrue(player.isDisabled());
        assertNotNull(player.getDisabledAt());
        assertFalse(player.getDisabledAt().isBefore(before));
        verify(players).save(player);
    }

    // Disabled behaviour 2
    @Test
    void adminsCantBeDisabled() {
        player.setAdmin(true);

        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.disable(player.getSteamId()));

        assertEquals(HttpStatus.CONFLICT, e.getStatusCode());
        assertFalse(player.isDisabled());
        verify(players, never()).save(any());
    }

    // Disabled behaviour 3
    @Test
    void disablingDropsSignupsForSeasonsStillTakingThem() {
        service.disable(player.getSteamId());

        verify(signups).deleteByPlayerSteamIdAndSeasonStatus(player.getSteamId(), SeasonStatus.REGISTRATION);
    }

    // Disabled behaviour 4
    @Test
    void enablingClearsIt() {
        player.setDisabledAt(LocalDateTime.now());

        service.enable(player.getSteamId());

        assertFalse(player.isDisabled());
        assertNull(player.getDisabledAt());
        verify(players).save(player);
    }

    // Disabled behaviour 5
    @Test
    void disablingSomeoneUnknownIsNotFound() {
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class, () -> service.disable("1")).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, assertThrows(ResponseStatusException.class, () -> service.enable("1")).getStatusCode());
    }

    // Disabled behaviours 6 and 7
    @Test
    void playerListLeavesOutDisabledPlayersUnlessAsked() {
        Player disabled = new Player();
        disabled.setSteamId("76561197960265730");
        disabled.setUsername("Gone");
        disabled.setElo(1700);
        disabled.setDisabledAt(LocalDateTime.now());
        player.setElo(1500);
        when(players.findAllByDisabledAtIsNullOrderByEloDesc()).thenReturn(List.of(player));
        when(players.findAllByOrderByEloDesc()).thenReturn(List.of(disabled, player));

        assertEquals(List.of(player.getSteamId()),
                service.getAllPlayersSummary(false).stream().map(PlayerSummaryResponse::steamId).toList());
        List<PlayerSummaryResponse> all = service.getAllPlayersSummary(true);
        assertEquals(List.of(disabled.getSteamId(), player.getSteamId()), all.stream().map(PlayerSummaryResponse::steamId).toList());
        assertEquals(List.of(true, false), all.stream().map(PlayerSummaryResponse::disabled).toList());
    }

    // Disabled behaviour 8
    @Test
    void disabledPlayersProfileStillLoadsWithTheirHistory() {
        LocalDateTime disabledAt = LocalDateTime.of(2026, 10, 1, 12, 0);
        player.setDisabledAt(disabledAt);
        playMatch(1, LocalDateTime.of(2026, 1, 1, 20, 0), null);

        PlayerDetailResponse detail = service.findById(player.getSteamId());

        assertTrue(detail.disabled());
        assertEquals(disabledAt, detail.disabledAt());
        assertEquals(1, detail.matches().size());
        assertEquals(1, detail.wins());
    }
}
