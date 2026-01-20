package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.request.CreateSeasonRequest;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSummaryResponse;
import com.plainoldmoose.IDLWebApp.service.SeasonService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/seasons")
public class SeasonController {
    private final SeasonService seasonService;

    @PostMapping
    public SeasonSummaryResponse createSeason(@Valid @RequestBody CreateSeasonRequest request) {
        return seasonService.createSeason(request);
    }

    @GetMapping
    public List<SeasonSummaryResponse> getAllSeasons() {
        return seasonService.getAllSeasons();
    }

    @GetMapping("/active")
    public SeasonDetailResponse getActiveSeason() {
        return seasonService.getActiveSeason();
    }

    @GetMapping("/{id}")
    public SeasonDetailResponse getSeasonById(@PathVariable UUID id) {
        return seasonService.getSeasonById(id);
    }
}
