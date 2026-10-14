package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.enums.LeagueMatchStatus;
import com.plainoldmoose.IDLWebApp.model.match.LeagueMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeagueMatchRepository extends JpaRepository<LeagueMatch, Long> {
    List<LeagueMatch> findBySeasonIdAndStatusOrderByPlayedTimeAsc(UUID seasonId, LeagueMatchStatus status);

    Optional<LeagueMatch> findByMatchIdAndSeasonIdAndStatus(Long matchId, UUID seasonId, LeagueMatchStatus status);
}
