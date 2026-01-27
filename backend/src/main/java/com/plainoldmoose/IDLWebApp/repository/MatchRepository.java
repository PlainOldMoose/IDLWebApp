package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.enums.MatchStatus;
import com.plainoldmoose.IDLWebApp.model.match.Match;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findBySeasonId(UUID seasonId);
    List<Match> findByRadiantTeamTeamIdOrDireTeamTeamId(UUID radiantTeamId, UUID direTeamId);

    @Query("SELECT m FROM Match m JOIN m.participants p WHERE p.player.steamId = :steamId")
    List<Match> findByParticipantSteamId(@Param("steamId") String steamId);

    List<Match> findByStatusOrderByScheduledTimeAsc(MatchStatus status, Pageable pageable);
}
