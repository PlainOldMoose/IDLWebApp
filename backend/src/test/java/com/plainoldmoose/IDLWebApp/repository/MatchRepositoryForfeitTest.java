package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

// Forfeit behaviour 6: nobody played a forfeit, so ELO's K inputs pass over it. JPQL, so it needs a real database
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:forfeitk;DB_CLOSE_DELAY=-1",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class MatchRepositoryForfeitTest {

    private static final LocalDateTime PLAYED = LocalDateTime.of(2026, 10, 1, 20, 0);

    @Autowired
    private MatchRepository matches;
    @Autowired
    private PlayerRepository players;
    @Autowired
    private SeasonRepository seasons;

    @Test
    void kInputsIgnoreForfeits() {
        Player player = new Player();
        player.setSteamId("1");
        player.setUsername("p1");
        players.save(player);
        Season season = new Season();
        season.setName("Season");
        season.setStatus(SeasonStatus.ACTIVE);
        season.setStartDate(LocalDate.of(2026, 9, 1));
        seasons.save(season);
        save(1L, PLAYED, season, player, false);
        save(-1L, PLAYED.plusDays(1), season, player, true);

        LocalDateTime later = PLAYED.plusDays(5);
        assertEquals(1, matches.countGamesBefore("1", later));
        assertEquals(PLAYED, matches.lastPlayedBefore("1", later));
        assertEquals(1, matches.countSeasonGamesBetween(PLAYED.minusDays(1), later));
    }

    private void save(long id, LocalDateTime played, Season season, Player player, boolean forfeit) {
        Match match = new Match();
        match.setMatchId(id);
        match.setSeason(season);
        match.setPlayedTime(played);
        match.setMatchWinner(Side.RADIANT);
        match.setForfeit(forfeit);
        MatchParticipant participant = new MatchParticipant();
        participant.setMatch(match);
        participant.setPlayer(player);
        participant.setSide(Side.RADIANT);
        match.setParticipants(new ArrayList<>(List.of(participant)));
        matches.save(match);
    }
}
