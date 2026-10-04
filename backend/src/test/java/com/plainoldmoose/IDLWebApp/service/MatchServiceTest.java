package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.request.CreateMatchRequest;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.TeamMember;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.EloHistoryRepository;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MatchServiceTest {

    private final MatchRepository matches = mock(MatchRepository.class);
    private final SeasonRepository seasons = mock(SeasonRepository.class);
    private final PlayerRepository players = mock(PlayerRepository.class);
    private final EloService elo = mock(EloService.class);
    private final MatchService service = new MatchService(matches, mock(EloHistoryRepository.class), seasons, players, elo);

    // Players 0-4 on the first team, 5-9 on the second, and 10 on neither
    private final List<Player> everyone = IntStream.range(0, 11).mapToObj(i -> {
        Player player = new Player();
        player.setSteamId(String.valueOf(i));
        return player;
    }).toList();
    private final Season season = new Season();
    private final Team radiant = team(0);
    private final Team dire = team(5);

    MatchServiceTest() {
        season.setId(UUID.randomUUID());
        season.setStatus(SeasonStatus.ACTIVE);
        season.setStartDate(LocalDate.now().minusWeeks(2));
        season.setTeams(List.of(radiant, dire));
        when(seasons.findById(season.getId())).thenReturn(Optional.of(season));
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
        return new CreateMatchRequest(8652158100L, season.getId(), LocalDateTime.now().minusDays(1), radiant.getTeamId(),
                dire.getTeamId(), Side.RADIANT, List.of("0", "1", "2", "3", "10"), List.of("5", "6", "7", "8", "9"));
    }

    @Test
    void onlyAnActiveSeasonTakesMatches() {
        season.setStatus(SeasonStatus.COMPLETED);
        ResponseStatusException e = assertThrows(ResponseStatusException.class, () -> service.create(request()));
        assertEquals(HttpStatus.CONFLICT, e.getStatusCode());
        verifyNoInteractions(elo);
    }

    @Test
    void addingAndDeletingMovesStandingsAndReplaysElo() {
        when(players.findAllById(any())).thenReturn(everyone.stream()
                .filter(player -> !player.getSteamId().equals("4"))
                .toList());
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
}
