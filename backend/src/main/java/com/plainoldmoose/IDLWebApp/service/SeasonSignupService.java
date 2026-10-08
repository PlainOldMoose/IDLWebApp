package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSignupResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.SeasonSignup;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonSignupRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@AllArgsConstructor
public class SeasonSignupService {

    private final SeasonSignupRepository seasonSignupRepository;
    private final SeasonRepository seasonRepository;
    private final PlayerRepository playerRepository;

    // Signing up again updates the existing sign-up, so players can change their preferences
    public SeasonSignupResponse signup(UUID seasonId, String steamId, String rolePreference, boolean willingToCaptain, boolean sub) {
        Season season = openSeason(seasonId);

        SeasonSignup seasonSignup = seasonSignupRepository.findBySeasonIdAndPlayerSteamId(seasonId, steamId)
                .orElseGet(() -> {
                    SeasonSignup created = new SeasonSignup();
                    created.setSeason(season);
                    created.setPlayer(playerRepository.findById(steamId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found")));
                    return created;
                });
        // Switching from sub to player joins the player queue now, so overflow stays first come, first served
        if (seasonSignup.isSub() && !sub) {
            seasonSignup.setSignedUpAt(LocalDateTime.now());
        }
        // Dedicated subs fill in for any team, so they have no roles and can't captain
        seasonSignup.setSub(sub);
        seasonSignup.setRolePreference(sub ? null : rolePreference.trim());
        seasonSignup.setWillingToCaptain(!sub && willingToCaptain);

        SeasonSignup saved = seasonSignupRepository.save(seasonSignup);
        return mapToResponse(saved, saved.isSub());
    }

    // Does nothing if the player wasn't signed up, so a repeated withdraw still succeeds
    public void withdraw(UUID seasonId, String steamId) {
        openSeason(seasonId);
        seasonSignupRepository.findBySeasonIdAndPlayerSteamId(seasonId, steamId)
                .ifPresent(seasonSignupRepository::delete);
    }

    // In sign-up order. Once sign-ups close, teams are 5 each, so the latest player sign-ups past a multiple of 5 are
    // subs too. Under 5 there's no full team, so nobody overflows
    public List<SeasonSignupResponse> getSignups(UUID seasonId) {
        List<SeasonSignup> signups = seasonSignupRepository.findBySeasonId(seasonId)
                .stream()
                .sorted(Comparator.comparing(SeasonSignup::getSignedUpAt))
                .toList();
        boolean open = seasonRepository.findById(seasonId)
                .map(season -> season.getStatus() == SeasonStatus.REGISTRATION)
                .orElse(true);
        List<SeasonSignup> players = signups.stream().filter(signup -> !signup.isSub()).toList();
        int teamPlaces = open || players.size() < 5 ? players.size() : players.size() - players.size() % 5;
        // SeasonSignup has no equals, so this matches by identity
        Set<SeasonSignup> overflow = new HashSet<>(players.subList(teamPlaces, players.size()));

        return signups.stream()
                .map(signup -> mapToResponse(signup, signup.isSub() || overflow.contains(signup)))
                .toList();
    }

    private Season openSeason(UUID seasonId) {
        Season season = seasonRepository.findById(seasonId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));

        if (season.getStatus() != SeasonStatus.REGISTRATION) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Season signups closed");
        }
        return season;
    }

    private SeasonSignupResponse mapToResponse(SeasonSignup signup, boolean sub) {
        return new SeasonSignupResponse(
                signup.getPlayer()
                        .getSteamId(),
                signup.getPlayer()
                        .getUsername(),
                signup.getRolePreference(),
                signup.isWillingToCaptain(),
                signup.getSignedUpAt(),
                sub
        );
    }
}
