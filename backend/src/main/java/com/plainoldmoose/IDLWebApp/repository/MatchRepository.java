package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.match.Match;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findAllByOrderByPlayedTimeDesc(Limit limit);

    List<Match> findBySeasonIdOrderByPlayedTimeDesc(UUID seasonId);

    List<Match> findBySeasonIdOrderByPlayedTimeDesc(UUID seasonId, Limit limit);

    boolean existsBySeasonId(UUID seasonId);

    List<Match> findByPlayedTimeGreaterThanEqualOrderByPlayedTimeAscMatchIdAsc(LocalDateTime from);

    // Season games and in-houses alike
    @Query("select count(p) from MatchParticipant p where p.player.steamId = :steamId and p.match.playedTime < :before and p.match.forfeit = false")
    long countGamesBefore(String steamId, LocalDateTime before);

    // Null if they hadn't played by then
    @Query("select max(p.match.playedTime) from MatchParticipant p where p.player.steamId = :steamId and p.match.playedTime < :before and p.match.forfeit = false")
    LocalDateTime lastPlayedBefore(String steamId, LocalDateTime before);

    @Query("select count(m) from Match m where m.season is not null and m.forfeit = false and m.playedTime > :after and m.playedTime < :before")
    long countSeasonGamesBetween(LocalDateTime after, LocalDateTime before);

    // Null with no matches. Forfeits count down from -1, below every Dota ID
    @Query("select min(m.matchId) from Match m")
    Long lowestMatchId();
}
