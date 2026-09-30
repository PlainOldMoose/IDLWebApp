package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSignupResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.SeasonSignup;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonSignupRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class SeasonSignupService {

    private final SeasonSignupRepository seasonSignupRepository;
    private final SeasonRepository seasonRepository;
    private final PlayerRepository playerRepository;

    public SeasonSignupResponse signup(UUID seasonId, String steamId, String rolePreference, boolean willingToCaptain) {
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));

        if (season.getStatus() != SeasonStatus.REGISTRATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Season signups closed");
        }

        Player player = playerRepository.findById(steamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));

        if (seasonSignupRepository.existsBySeasonIdAndPlayerSteamId(season.getId(), steamId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Player already signed up for this season");
        }

        SeasonSignup seasonSignup = new SeasonSignup();
        seasonSignup.setSeason(season);
        seasonSignup.setPlayer(player);
        seasonSignup.setRolePreference(rolePreference);
        seasonSignup.setWillingToCaptain(willingToCaptain);

        SeasonSignup saved = seasonSignupRepository.save(seasonSignup);
        return mapToResponse(saved);
    }

    public List<SeasonSignupResponse> getSignups(UUID seasonId) {
        return seasonSignupRepository.findBySeasonId(seasonId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private SeasonSignupResponse mapToResponse(SeasonSignup signup) {
        return new SeasonSignupResponse(
                signup.getId(),
                signup.getPlayer()
                        .getSteamId(),
                signup.getPlayer()
                        .getUsername(),
                signup.getRolePreference(),
                signup.isWillingToCaptain(),
                signup.getSignedUpAt()
        );
    }
}
