package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@Service
@AllArgsConstructor
public class SeasonService {

    private SeasonRepository seasonRepository;

    @GetMapping
    public List<Season> getAllSeasons() {
        return seasonRepository.findAll();
    }

    public void insertSeason(Season season) {
        seasonRepository.save(season);
    }
}
