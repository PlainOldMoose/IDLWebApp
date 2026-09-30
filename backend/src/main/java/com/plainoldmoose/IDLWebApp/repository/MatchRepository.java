package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.match.Match;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findAllByOrderByPlayedTimeDesc();

    List<Match> findBySeasonIdOrderByPlayedTimeDesc(UUID seasonId);

    boolean existsBySeasonId(UUID seasonId);
}
