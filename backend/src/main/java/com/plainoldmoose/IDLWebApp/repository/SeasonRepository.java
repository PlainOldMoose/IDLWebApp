package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.Season;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SeasonRepository extends JpaRepository<Season, UUID> {
    List<Season> findAllByOrderByStartDateDesc();
}
