package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.player.EloHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EloHistoryRepository extends JpaRepository<EloHistory, Long> {
    List<EloHistory> findByMatchMatchId(Long matchId);

    List<EloHistory> findByMatchPlayedTimeGreaterThanEqual(LocalDateTime from);

    // The player's ELO as it stood at a given time
    Optional<EloHistory> findFirstByPlayerSteamIdAndTimestampBeforeOrderByTimestampDesc(String steamId, LocalDateTime before);

    // Their ELO just after a given time's games
    Optional<EloHistory> findFirstByPlayerSteamIdAndTimestampLessThanEqualOrderByTimestampDescIdDesc(String steamId, LocalDateTime at);

    // Their first game after a given time, whose ELO before it is what they had then
    Optional<EloHistory> findFirstByPlayerSteamIdAndTimestampAfterOrderByTimestampAscIdAsc(String steamId, LocalDateTime after);

    // Their starting ELO
    Optional<EloHistory> findFirstByPlayerSteamIdOrderByTimestampAsc(String steamId);
}
