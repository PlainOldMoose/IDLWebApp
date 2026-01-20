package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.response.admin.AdminStatsResponse;
import com.plainoldmoose.IDLWebApp.repository.MatchRepository;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import com.plainoldmoose.IDLWebApp.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final PlayerRepository playerRepository;
    private final MatchRepository matchRepository;
    private final SeasonRepository seasonRepository;
    private final TeamRepository teamRepository;

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        return new AdminStatsResponse(
                playerRepository.count(),
                matchRepository.count(),
                seasonRepository.count(),
                teamRepository.count()
        );
    }
}