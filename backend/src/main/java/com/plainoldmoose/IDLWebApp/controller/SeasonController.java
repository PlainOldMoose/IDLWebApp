package com.plainoldmoose.IDLWebApp.controller;

import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonDetailResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSummaryResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.service.SeasonService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/seasons")
public class SeasonController {
    private final SeasonService seasonService;

    @GetMapping
    public List<SeasonDetailResponse> getAllSeasons() {
        return seasonService.getAllSeasons();
    }

    @GetMapping("/{id}")
    public SeasonDetailResponse getSeasonById(@PathVariable long id) {
        return seasonService.getSeasonById(id);
    }

    @PostMapping
    public void addNewSeason(@RequestBody Season season) {
        seasonService.insertSeason(season);
    }
}
