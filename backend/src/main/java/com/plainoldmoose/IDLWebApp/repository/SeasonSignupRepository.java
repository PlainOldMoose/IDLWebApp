package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.SeasonSignup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SeasonSignupRepository extends JpaRepository<SeasonSignup, Long> {

    List<SeasonSignup> findBySeasonId(UUID seasonId);

    Optional<SeasonSignup> findBySeasonIdAndPlayerSteamId(UUID seasonId, String steamId);

    boolean existsBySeasonIdAndPlayerSteamId(UUID seasonId, String steamId);

    long countBySeasonId(UUID seasonId);

    long countBySeasonIdAndWillingToCaptainTrue(UUID seasonId);
}
