package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.match.DeletedMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface DeletedMatchRepository extends JpaRepository<DeletedMatch, Long> {
    List<DeletedMatch> findBySeasonIdOrderByDeletedAtDesc(UUID seasonId);

    void deleteByDeletedAtBefore(LocalDateTime cutoff);

    void deleteBySeasonId(UUID seasonId);
}
