package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSignupResponse;
import com.plainoldmoose.IDLWebApp.dto.response.season.SignupStatusResponse;
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

    public SeasonSignupResponse signup(UUID seasonId, String steamId, boolean willingToCaptain) {
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
        seasonSignup.setWillingToCaptain(willingToCaptain);

        SeasonSignup saved = seasonSignupRepository.save(seasonSignup);
        return mapToResponse(saved);
    }

    public void withdraw(UUID seasonId, String steamId) {
        SeasonSignup signup = seasonSignupRepository.findBySeasonIdAndPlayerSteamId(seasonId, steamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Signup not found"));

        if (signup.getSeason()
                .getStatus() != SeasonStatus.REGISTRATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot withdraw: season is not in registration");
        }

        seasonSignupRepository.delete(signup);
    }

    public List<SeasonSignupResponse> getSignups(UUID seasonId) {
        return seasonSignupRepository.findBySeasonId(seasonId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public SignupStatusResponse getSignupStatus(UUID seasonId) {
        long totalSignups = seasonSignupRepository.countBySeasonId(seasonId);
        long captainVolunteers = seasonSignupRepository.countBySeasonIdAndWillingToCaptainTrue(seasonId);
        long captainsNeeded = totalSignups / 5;

        return new SignupStatusResponse(totalSignups, captainVolunteers, captainsNeeded);
    }

    private SeasonSignupResponse mapToResponse(SeasonSignup signup) {
        return new SeasonSignupResponse(
                signup.getId(),
                signup.getPlayer()
                        .getSteamId(),
                signup.getPlayer()
                        .getUsername(),
                signup.isWillingToCaptain(),
                signup.getSignedUpAt()
        );
    }
}
