package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.SeasonSignup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeasonSignupRepository extends JpaRepository<SeasonSignup, long> {

    List<SeasonSignup> findBySeasonId(long seasonId);

    Optional<SeasonSignup> findBySeasonIdAndPlayerSteamId(long seasonId, String steamId);

    boolean existsBySeasonIdAndPlayerSteamId(long seasonId, String steamId);

    long countBySeasonId(long seasonId);

    long countBySeasonIdAndWillingToCaptainTrue(long seasonId);
}
