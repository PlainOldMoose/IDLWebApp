package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EloHistoryRepository extends JpaRepository<EloHistory, Long> {
    List<EloHistory> findByMatchMatchId(Long matchId);
}
