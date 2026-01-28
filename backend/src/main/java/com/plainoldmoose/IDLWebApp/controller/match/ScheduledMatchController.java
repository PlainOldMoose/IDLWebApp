package com.plainoldmoose.IDLWebApp.controller.match;

import com.plainoldmoose.IDLWebApp.dto.request.CreateScheduledMatchRequest;
import com.plainoldmoose.IDLWebApp.dto.response.match.ScheduledMatchSummaryResponse;
import com.plainoldmoose.IDLWebApp.service.ScheduledMatchService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@AllArgsConstructor
@RequestMapping(path = "api/scheduled-matches")
public class ScheduledMatchController {
    private final ScheduledMatchService scheduledMatchService;

    @PostMapping
    public ScheduledMatchSummaryResponse createScheduledMatch(@Valid @RequestBody CreateScheduledMatchRequest request) {
        return scheduledMatchService.createScheduledMatch(request);
    }

    @GetMapping
    public List<ScheduledMatchSummaryResponse> getAllScheduledMatches() {
        return scheduledMatchService.getAllScheduledMatches();
    }
}
