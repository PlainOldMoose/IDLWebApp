package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.match.MatchDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.MatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.ParticipantResponse;
import com.plainoldmoose.IDLWebApp.dto.response.match.UpcomingMatchResponse;
import com.plainoldmoose.IDLWebApp.model.EloHistory;
import com.plainoldmoose.IDLWebApp.model.Match;
import com.plainoldmoose.IDLWebApp.model.MatchParticipant;
import com.plainoldmoose.IDLWebApp.model.Player;
import com.plainoldmoose.IDLWebApp.model.enums.MatchStatus;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class MatchService {
    private final MatchRepository matchRepository;

    public List<MatchSummaryResponse> getAllMatches(UUID seasonId, UUID teamId, String playerSteamId) {
        List<Match> matches;

        if (seasonId != null) {
            matches = matchRepository.findBySeasonId(seasonId);
        } else if (teamId != null) {
            matches = matchRepository.findByRadiantTeamTeamIdOrDireTeamTeamId(teamId, teamId);
        } else if (playerSteamId != null) {
            matches = matchRepository.findByParticipantSteamId(playerSteamId);
        } else {
            matches = matchRepository.findAll();
        }

        if (seasonId != null && teamId != null) {
            UUID finalTeamId = teamId;
            matches = matches.stream()
                    .filter(m -> m.getRadiantTeam()
                            .getTeamId()
                            .equals(finalTeamId) || m.getDireTeam()
                            .getTeamId()
                            .equals(finalTeamId))
                    .toList();
        }

        if (seasonId != null && playerSteamId != null) {
            String finalSteaamId = playerSteamId;
            matches = matches.stream()
                    .filter(m -> m.getParticipants()
                            .stream()
                            .anyMatch(p -> p.getPlayer()
                                    .getSteamId()
                                    .equals(finalSteaamId)))
                    .toList();
        }

        return matches.stream()
                .map(this::mapToSummaryResponse)
                .toList();
    }

    public MatchDetailResponse getMatchById(Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        List<ParticipantResponse> participants = match.getParticipants()
                .stream()
                .map(this::mapToParticipantResponse)
                .toList();

        return new MatchDetailResponse(
                match.getMatchId(),
                match.getMatchWinner(),
                match.getPlayedTime(),
                match.getScheduledTime(),
                match.getAvgElo(),
                match.getSeason() != null ? match.getSeason()
                        .getName() : null,
                match.getRadiantTeam() != null ? match.getRadiantTeam()
                        .getName() : null,
                match.getDireTeam() != null ? match.getDireTeam()
                        .getName() : null,
                participants
        );
    }

    private MatchSummaryResponse mapToSummaryResponse(Match match) {
        return new MatchSummaryResponse(
                match.getMatchId(),
                match.getMatchWinner(),
                match.getPlayedTime(),
                match.getAvgElo(),
                match.getSeason() != null ? match.getSeason()
                        .getName() : null);
    }

    private ParticipantResponse mapToParticipantResponse(MatchParticipant participant) {
        Player player = participant.getPlayer();

        int eloChange = player.getEloHistory()
                .stream()
                .filter(eh -> eh.getMatch() != null && eh.getMatch()
                        .getMatchId().equals(participant.getMatch()
                        .getMatchId()))
                .findFirst()
                .map(EloHistory::getEloChange)
                .orElse(0);

        return new ParticipantResponse(
                player.getSteamId(),
                player.getUsername(),
                player.getElo(),
                participant.getSide(),
                eloChange,
                participant.getIsSub() != null && participant.getIsSub(),
                participant.getSubbingFor() != null ? participant.getSubbingFor()
                        .getSteamId() : null,
                participant.getSubbingFor() != null ? participant.getSubbingFor()
                        .getUsername() : null
        );
    }

    public List<UpcomingMatchResponse> getUpcomingMatches(int limit) {
        List<Match> matches = matchRepository.findByStatusOrderByScheduledTimeAsc(
                MatchStatus.SCHEDULED,
                PageRequest.of(0, limit)
        );

        return matches.stream()
                .map(this::mapToUpcomingMatchResponse)
                .toList();
    }

    private UpcomingMatchResponse mapToUpcomingMatchResponse(Match match) {
        return new UpcomingMatchResponse(
                match.getMatchId(),
                match.getScheduledTime(),
                match.getSeason() != null ? match.getSeason().getName() : null,
                match.getRadiantTeam() != null ? match.getRadiantTeam().getName() : null,
                match.getDireTeam() != null ? match.getDireTeam().getName() : null,
                match.getRadiantTeam() != null ? match.getRadiantTeam().getAvgElo() : 0,
                match.getDireTeam() != null ? match.getDireTeam().getAvgElo() : 0
        );
    }
}
