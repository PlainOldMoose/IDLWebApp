package com.plainoldmoose.IDLWebApp.service;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.SeasonSignup;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonRepository;
import com.plainoldmoose.IDLWebApp.repository.SeasonSignupRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

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

        service.signup(seasonId, "1", "any", true);

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
        assertThrows(ResponseStatusException.class, () -> service.signup(seasonId, "1", "1", false));

        // Only the first withdraw got as far as the sign-ups
        verify(signups, times(1)).delete(existing);
        verify(signups, never()).save(any());
    }
}
