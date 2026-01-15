package com.plainoldmoose.IDLWebApp.controller;

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
    public List<Season> getAllSeasons() {
        return seasonService.getAllSeasons();
    }

    @PostMapping
    public void addNewSeason(@RequestBody Season season) {
        seasonService.insertSeason(season);
    }
}
