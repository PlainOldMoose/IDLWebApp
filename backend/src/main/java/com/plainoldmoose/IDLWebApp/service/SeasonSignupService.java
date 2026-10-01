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

    // Signing up again updates the existing sign-up, so players can change their preferences
    public SeasonSignupResponse signup(UUID seasonId, String steamId, String rolePreference, boolean willingToCaptain) {
        Season season = openSeason(seasonId);

        SeasonSignup seasonSignup = seasonSignupRepository.findBySeasonIdAndPlayerSteamId(seasonId, steamId)
                .orElseGet(() -> {
                    SeasonSignup created = new SeasonSignup();
                    created.setSeason(season);
                    created.setPlayer(playerRepository.findById(steamId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found")));
                    return created;
                });
        seasonSignup.setRolePreference(rolePreference);
        seasonSignup.setWillingToCaptain(willingToCaptain);

        SeasonSignup saved = seasonSignupRepository.save(seasonSignup);
        return mapToResponse(saved);
    }

    // Does nothing if the player wasn't signed up, so a repeated withdraw still succeeds
    public void withdraw(UUID seasonId, String steamId) {
        openSeason(seasonId);
        seasonSignupRepository.findBySeasonIdAndPlayerSteamId(seasonId, steamId)
                .ifPresent(seasonSignupRepository::delete);
    }

    public List<SeasonSignupResponse> getSignups(UUID seasonId) {
        return seasonSignupRepository.findBySeasonId(seasonId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Sign-ups can only change while the season is taking them
    private Season openSeason(UUID seasonId) {
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));

        if (season.getStatus() != SeasonStatus.REGISTRATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Season signups closed");
        }
        return season;
    }

    private SeasonSignupResponse mapToResponse(SeasonSignup signup) {
        return new SeasonSignupResponse(
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
