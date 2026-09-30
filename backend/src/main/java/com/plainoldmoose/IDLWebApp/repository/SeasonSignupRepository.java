package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.SeasonSignup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SeasonSignupRepository extends JpaRepository<SeasonSignup, Long> {

    List<SeasonSignup> findBySeasonId(UUID seasonId);

    boolean existsBySeasonIdAndPlayerSteamId(UUID seasonId, String steamId);
}
