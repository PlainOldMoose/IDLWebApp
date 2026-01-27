package com.plainoldmoose.IDLWebApp.controller.match;

import com.plainoldmoose.IDLWebApp.dto.response.ScheduledMatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.service.ScheduledMatchService;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/scheduled-matches")
public class ScheduledMatchController {
    private final ScheduledMatchService scheduledMatchSeervice;

    @GetMapping
    public List<ScheduledMatchSummaryResponse> getAllScheduledMatches() {
        return scheduledMatchSeervice.getAllScheduledMatches();
    }
}
