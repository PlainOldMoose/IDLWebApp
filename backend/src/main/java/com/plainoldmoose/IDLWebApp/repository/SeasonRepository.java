package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.Season;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SeasonRepository extends JpaRepository<Season, UUID> {
    List<Season> findAllByOrderByStartDateDesc();

    // Same as findById, but holds the row until the transaction ends
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Season> findLockedById(UUID id);
}
