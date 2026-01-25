package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SeasonRepository extends JpaRepository<Season, UUID> {
    Optional<Season> findByName(String name);
    Optional<Season> findByStatus(SeasonStatus status);
}
