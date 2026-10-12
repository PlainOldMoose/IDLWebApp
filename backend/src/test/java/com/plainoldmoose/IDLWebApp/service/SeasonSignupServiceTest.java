package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.dto.response.season.SeasonSignupResponse;
import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.SeasonSignup;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonSignupRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SeasonSignupServiceTest {

    private final UUID seasonId = UUID.randomUUID();
    private final Season season = new Season();
    private final SeasonSignupRepository signups = mock(SeasonSignupRepository.class);
    private final SeasonSignupService service =
            new SeasonSignupService(signups, mock(SeasonRepository.class, inv -> Optional.of(season)), mock(PlayerRepository.class));

    @Test
    void signingUpAgainUpdatesTheExistingSignup() {
        SeasonSignup existing = new SeasonSignup();
        existing.setSeason(season);
        existing.setPlayer(new Player());
        when(signups.findBySeasonIdAndPlayerSteamId(seasonId, "1")).thenReturn(Optional.of(existing));
        when(signups.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.signup(seasonId, "1", "any", true, false);

        verify(signups).save(existing);
        assertEquals("any", existing.getRolePreference());
        assertEquals(true, existing.isWillingToCaptain());
    }

    @Test
    void withdraw() {
        SeasonSignup existing = new SeasonSignup();
        when(signups.findBySeasonIdAndPlayerSteamId(seasonId, "1")).thenReturn(Optional.of(existing));

        service.withdraw(seasonId, "1");

        // Once teams are being picked the sign-up list is fixed
        season.setStatus(SeasonStatus.ACTIVE);
        assertThrows(ResponseStatusException.class, () -> service.withdraw(seasonId, "1"));
        assertThrows(ResponseStatusException.class, () -> service.signup(seasonId, "1", "1", false, false));

        // Only the first withdraw got as far as the sign-ups
        verify(signups, times(1)).delete(existing);
        verify(signups, never()).save(any());
    }

    @Test
    void signingUpAsASubDropsRolesAndCaptain() {
        SeasonSignup existing = new SeasonSignup();
        existing.setSeason(season);
        existing.setPlayer(new Player());
        existing.setRolePreference("1 > 2");
        existing.setWillingToCaptain(true);
        when(signups.findBySeasonIdAndPlayerSteamId(seasonId, "1")).thenReturn(Optional.of(existing));
        when(signups.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SeasonSignupResponse response = service.signup(seasonId, "1", "3", true, true);

        assertEquals(true, existing.isSub());
        assertEquals(null, existing.getRolePreference());
        assertEquals(false, existing.isWillingToCaptain());
        assertEquals(true, response.sub());

        // And back to a player
        service.signup(seasonId, "1", "any", false, false);
        assertEquals(false, existing.isSub());
        assertEquals("any", existing.getRolePreference());
    }

    // Player sign-ups numbered by sign-up order, plus any dedicated subs, returned shuffled so the service has to sort
    private List<String> subsFor(SeasonStatus status, int players, int dedicatedSubs) {
        season.setStatus(status);
        List<SeasonSignup> all = new ArrayList<>();
        LocalDateTime start = LocalDateTime.of(2026, 1, 1, 12, 0);
        for (int i = 0; i < players + dedicatedSubs; i++) {
            Player player = new Player();
            player.setSteamId(i < players ? "p" + i : "s" + (i - players));
            SeasonSignup signup = new SeasonSignup();
            signup.setSeason(season);
            signup.setPlayer(player);
            signup.setSub(i >= players);
            signup.setSignedUpAt(start.plusMinutes(i));
            all.add(signup);
        }
        Collections.reverse(all);
        when(signups.findBySeasonId(seasonId)).thenReturn(all);
        return service.getSignups(seasonId).stream()
                .filter(SeasonSignupResponse::sub)
                .map(SeasonSignupResponse::steamId)
                .sorted()
                .toList();
    }

    @Test
    void dedicatedSubsAreSubs() {
        assertEquals(List.of("s0", "s1"), subsFor(SeasonStatus.REGISTRATION, 5, 2));
    }

    @Test
    void noOverflowWhileSignupsAreOpen() {
        assertEquals(List.of(), subsFor(SeasonStatus.REGISTRATION, 7, 0));
    }

    @Test
    void latestPlayersPastAMultipleOfFiveBecomeSubsOnceSignupsClose() {
        assertEquals(List.of("p5", "p6", "s0"), subsFor(SeasonStatus.ACTIVE, 7, 1));
        assertEquals(List.of("p10", "p11"), subsFor(SeasonStatus.COMPLETED, 12, 0));
        assertEquals(List.of(), subsFor(SeasonStatus.ACTIVE, 10, 0));
    }

    @Test
    void noOverflowUnderFivePlayers() {
        assertEquals(List.of(), subsFor(SeasonStatus.ACTIVE, 4, 0));
    }

    @Test
    void aSubSwitchingToPlayerGoesToTheBackOfTheQueue() {
        LocalDateTime dayOne = LocalDateTime.of(2026, 1, 1, 12, 0);
        SeasonSignup existing = new SeasonSignup();
        existing.setSeason(season);
        existing.setPlayer(new Player());
        existing.setSub(true);
        existing.setSignedUpAt(dayOne);
        when(signups.findBySeasonIdAndPlayerSteamId(seasonId, "1")).thenReturn(Optional.of(existing));
        when(signups.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Only the switch to player counts as signing up as one; editing a player sign-up keeps its place
        service.signup(seasonId, "1", "any", false, false);
        LocalDateTime switched = existing.getSignedUpAt();
        assertEquals(true, switched.isAfter(dayOne));

        service.signup(seasonId, "1", "1", true, false);
        assertEquals(switched, existing.getSignedUpAt());
    }
}
