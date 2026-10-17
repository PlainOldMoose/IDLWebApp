package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.match.DeletedMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface DeletedMatchRepository extends JpaRepository<DeletedMatch, Long> {
    List<DeletedMatch> findBySeasonIdOrderByDeletedAtDesc(UUID seasonId);

    void deleteByDeletedAtBefore(LocalDateTime cutoff);

    void deleteBySeasonId(UUID seasonId);

    // Null with an empty bin. A new forfeit's ID goes below these too, so it can't take a binned forfeit's
    @Query("select min(d.matchId) from DeletedMatch d")
    Long lowestMatchId();
}
