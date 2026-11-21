package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SeasonRepository extends JpaRepository<Season, UUID> {
    List<Season> findAllByOrderByStartDateDesc();

    List<Season> findByStatusAndLeagueIdNotNull(SeasonStatus status);

    // Same as findById, but holds the row until the transaction ends
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Season> findLockedById(UUID id);

    // For findById(id).orElseThrow(SeasonRepository::notFound)
    static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found");
    }
}
