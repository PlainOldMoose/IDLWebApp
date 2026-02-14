package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EloHistoryRepository extends JpaRepository<EloHistory, Long> {
}
