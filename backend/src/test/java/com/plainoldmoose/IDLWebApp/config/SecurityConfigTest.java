package com.plainoldmoose.IDLWebApp.config;

import com.plainoldmoose.IDLWebApp.controller.DraftController;
import com.plainoldmoose.IDLWebApp.controller.InhouseController;
import com.plainoldmoose.IDLWebApp.controller.LeagueSyncController;
import com.plainoldmoose.IDLWebApp.controller.SeasonController;
import com.plainoldmoose.IDLWebApp.controller.MatchController;
import com.plainoldmoose.IDLWebApp.controller.PlayerController;
import com.plainoldmoose.IDLWebApp.dto.response.auth.SteamUserResponse;
import com.plainoldmoose.IDLWebApp.service.DraftService;
import com.plainoldmoose.IDLWebApp.service.InhouseService;
import com.plainoldmoose.IDLWebApp.service.MatchService;
import com.plainoldmoose.IDLWebApp.service.MatchSyncService;
import com.plainoldmoose.IDLWebApp.service.PlayerService;
import com.plainoldmoose.IDLWebApp.service.SeasonService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// SecurityConfig's rule order is the whole authorisation model, so these pin down who gets through to what
@WebMvcTest({SeasonController.class, InhouseController.class, MatchController.class, DraftController.class, LeagueSyncController.class,
        PlayerController.class})
@Import(SecurityConfig.class)
class SecurityConfigTest {

    private static final String SEASON = "/api/seasons/" + UUID.randomUUID();
    private static final RequestPostProcessor PLAYER = user("76561198000000000").roles("USER");
    private static final RequestPostProcessor ADMIN = user("76561198000000001").roles("USER", "ADMIN");

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private SeasonService seasonService;

    @MockitoBean
    private InhouseService inhouseService;

    @MockitoBean
    private MatchService matchService;

    @MockitoBean
    private PlayerService playerService;

    @MockitoBean
    private DraftService draftService;

    @MockitoBean
    private MatchSyncService matchSyncService;

    // Roles come from the player row on every request, so the signed-in users need one
    @BeforeEach
    void players() {
        when(playerService.findSteamUser("76561198000000000"))
                .thenReturn(Optional.of(new SteamUserResponse("76561198000000000", "player", false, false)));
        when(playerService.findSteamUser("76561198000000001"))
                .thenReturn(Optional.of(new SteamUserResponse("76561198000000001", "admin", true, false)));
        when(playerService.findSteamUser("76561198000000003"))
                .thenReturn(Optional.of(new SteamUserResponse("76561198000000003", "disabled", false, true)));
    }

    @Test
    void anyoneCanRead() throws Exception {
        mvc.perform(get("/api/seasons")).andExpect(status().isOk());
    }

    @Test
    void signedOutVisitorCantWrite() throws Exception {
        mvc.perform(delete("/api/inhouses/1").with(csrf())).andExpect(status().isForbidden());
    }

    @Test
    void playerCanUseInhouses() throws Exception {
        mvc.perform(delete("/api/inhouses/1").with(PLAYER).with(csrf())).andExpect(status().isNoContent());
    }

    @Test
    void playerCantDoAdminWrites() throws Exception {
        mvc.perform(delete(SEASON).with(PLAYER).with(csrf())).andExpect(status().isForbidden());
    }

    @Test
    void adminCanDoAdminWrites() throws Exception {
        mvc.perform(delete(SEASON).with(ADMIN).with(csrf())).andExpect(status().isNoContent());
    }

    @Test
    void onlyAdminsAddOrDeleteMatches() throws Exception {
        mvc.perform(post("/api/matches").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete("/api/matches/1").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete("/api/matches/1").with(ADMIN).with(csrf())).andExpect(status().isNoContent());
    }

    // Behaviour 56
    @Test
    void onlyAdminsSeeTheBinOrRestore() throws Exception {
        mvc.perform(get("/api/matches/bin").param("seasonId", UUID.randomUUID().toString())).andExpect(status().isForbidden());
        mvc.perform(get("/api/matches/bin").param("seasonId", UUID.randomUUID().toString()).with(PLAYER)).andExpect(status().isForbidden());
        mvc.perform(post("/api/matches/1/restore").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(get("/api/matches/bin").param("seasonId", UUID.randomUUID().toString()).with(ADMIN)).andExpect(status().isOk());
        mvc.perform(post("/api/matches/1/restore").with(ADMIN).with(csrf())).andExpect(status().isNoContent());
    }

    @Test
    void onlyAdminsSeeOrApproveTheQueue() throws Exception {
        mvc.perform(get("/api/inhouses/pending")).andExpect(status().isForbidden());
        mvc.perform(get("/api/inhouses/pending").with(PLAYER)).andExpect(status().isForbidden());
        mvc.perform(post("/api/inhouses/1/approve").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
    }

    @Test
    void adminCanSeeAndApproveTheQueue() throws Exception {
        mvc.perform(get("/api/inhouses/pending").with(ADMIN)).andExpect(status().isOk());
        mvc.perform(post("/api/inhouses/1/approve").with(ADMIN).with(csrf())).andExpect(status().isNoContent());
    }

    // The league queue shows unregistered Steam accounts, so even reading it is admin-only
    @Test
    void onlyAdminsSeeOrRunTheLeagueSync() throws Exception {
        mvc.perform(get(SEASON + "/league")).andExpect(status().isForbidden());
        mvc.perform(get(SEASON + "/league").with(PLAYER)).andExpect(status().isForbidden());
        mvc.perform(post(SEASON + "/league/sync").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete(SEASON + "/league/pending/1").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(put(SEASON + "/league").with(PLAYER).with(csrf())
                .contentType("application/json").content("{\"leagueId\":15728}")).andExpect(status().isForbidden());
    }

    @Test
    void adminCanSeeAndRunTheLeagueSync() throws Exception {
        mvc.perform(get(SEASON + "/league").with(ADMIN)).andExpect(status().isOk());
        mvc.perform(post(SEASON + "/league/sync").with(ADMIN).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(put(SEASON + "/league").with(ADMIN).with(csrf())
                .contentType("application/json").content("{\"leagueId\":15728}")).andExpect(status().isNoContent());
    }

    @Test
    void onlyAdminsStartTheDraftChangeCaptainsOrStartTheSeason() throws Exception {
        mvc.perform(post(SEASON + "/draft").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(put(SEASON + "/draft/captains/1").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete(SEASON + "/draft/captains/1").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(post(SEASON + "/draft/start").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(post(SEASON + "/draft/start").with(ADMIN).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(post(SEASON + "/draft").with(ADMIN).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(put(SEASON + "/draft/captains/1").with(ADMIN).with(csrf())).andExpect(status().isNoContent());
    }

    // DraftService checks it's the right captain
    @Test
    void playersReachPicksAndRenames() throws Exception {
        mvc.perform(get(SEASON + "/draft")).andExpect(status().isOk());
        mvc.perform(post(SEASON + "/draft/picks").with(csrf())
                .contentType("application/json").content("{\"steamId\":\"1\"}")).andExpect(status().isForbidden());
        mvc.perform(post(SEASON + "/draft/picks").with(PLAYER).with(csrf())
                .contentType("application/json").content("{\"steamId\":\"1\"}")).andExpect(status().isNoContent());
        mvc.perform(put(SEASON + "/draft/teams/" + UUID.randomUUID()).with(PLAYER).with(csrf())
                .contentType("application/json").content("{\"name\":\"Team\"}")).andExpect(status().isNoContent());
    }

    @Test
    void writesNeedCsrfToken() throws Exception {
        mvc.perform(delete(SEASON).with(ADMIN)).andExpect(status().isForbidden());
    }

    // The session still says admin, but the row was flipped to false since sign-in
    @Test
    void revokedAdminLosesAdminStraightAway() throws Exception {
        RequestPostProcessor revoked = user("76561198000000000").roles("USER", "ADMIN");
        mvc.perform(delete(SEASON).with(revoked).with(csrf())).andExpect(status().isForbidden());
    }

    @Test
    void deletedPlayerIsSignedOut() throws Exception {
        RequestPostProcessor deleted = user("76561198000000002").roles("USER");
        mvc.perform(delete("/api/inhouses/1").with(deleted).with(csrf())).andExpect(status().isForbidden());
    }

    // Disabled behaviour 10: disabled since sign-in, so the session no longer counts
    @Test
    void disabledPlayerIsSignedOut() throws Exception {
        RequestPostProcessor disabled = user("76561198000000003").roles("USER");
        mvc.perform(delete("/api/inhouses/1").with(disabled).with(csrf())).andExpect(status().isForbidden());
    }

    // Disabled behaviour 11
    @Test
    void onlyAdminsDisableOrEnablePlayers() throws Exception {
        String disabled = "/api/players/76561198000000000/disabled";
        mvc.perform(put(disabled).with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete(disabled).with(PLAYER).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(put(disabled).with(ADMIN).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(delete(disabled).with(ADMIN).with(csrf())).andExpect(status().isNoContent());
    }

    // Disabled players are listed only for admins; anyone else asking gets the normal list
    @Test
    void onlyAdminsGetDisabledPlayersListed() throws Exception {
        String all = "/api/players?includeDisabled=true";
        mvc.perform(get(all)).andExpect(status().isOk());
        mvc.perform(get(all).with(PLAYER)).andExpect(status().isOk());
        verify(playerService, times(2)).getAllPlayersSummary(false);
        mvc.perform(get(all).with(ADMIN)).andExpect(status().isOk());
        verify(playerService).getAllPlayersSummary(true);
    }
}
