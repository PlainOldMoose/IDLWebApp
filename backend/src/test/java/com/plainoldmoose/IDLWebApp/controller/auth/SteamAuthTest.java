package com.plainoldmoose.IDLWebApp.controller.auth;

import com.plainoldmoose.IDLWebApp.service.SteamAuthService;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class SteamAuthTest {
    private static final String CALLBACK = "https://idl.vandermerwe.uk/auth/callback";

    // Steam's own signature check always passes here, so these cover only our checks and need no network
    private final SteamAuthService steamAuthService = new SteamAuthService() {
        @Override
        protected boolean checkWithSteam(Map<String, String> params) {
            return true;
        }
    };

    // A Steam login made for this site, as Steam sends it back
    private static Map<String, String> login() {
        Map<String, String> params = new HashMap<>();
        params.put("openid.op_endpoint", SteamAuthService.STEAM_LOGIN);
        params.put("openid.claimed_id", "https://steamcommunity.com/openid/id/76561198000000000");
        params.put("openid.return_to", CALLBACK + "?returnTo=%2F");
        params.put("openid.response_nonce", Instant.now().truncatedTo(ChronoUnit.SECONDS) + "Qx3kP0");
        params.put("openid.signed", "signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle");
        return params;
    }

    private void assertRejected(String param, String value) {
        Map<String, String> params = login();
        params.put(param, value);
        assertEquals(Optional.empty(), steamAuthService.verify(params, CALLBACK));
    }

    @Test
    void acceptsLoginMadeForThisSite() {
        assertEquals(Optional.of("76561198000000000"), steamAuthService.verify(login(), CALLBACK));
    }

    @Test
    void rejectsLoginMadeForAnotherSite() {
        assertRejected("openid.return_to", "https://evil.com/auth/callback?returnTo=%2F");
    }

    @Test
    void rejectsLookalikeSite() {
        assertRejected("openid.return_to", "https://idl.vandermerwe.uk.evil.com/auth/callback?returnTo=%2F");
    }

    @Test
    void rejectsUnsignedClaimedId() {
        assertRejected("openid.signed", "signed,op_endpoint,identity,return_to,response_nonce,assoc_handle");
    }

    @Test
    void rejectsOtherProvider() {
        assertRejected("openid.op_endpoint", "https://evil.com/openid/login");
    }

    @Test
    void rejectsMalformedClaimedId() {
        assertRejected("openid.claimed_id", "https://evil.com/openid/id/76561198000000000");
    }

    @Test
    void rejectsStaleNonce() {
        assertRejected("openid.response_nonce", "2020-01-01T00:00:00ZQx3kP0");
    }

    @Test
    void redirectsOnlyWithinThisSite() {
        assertEquals("/seasons/1", SteamAuthController.localPath("/seasons/1"));
        assertEquals("/", SteamAuthController.localPath(".evil.com"));
        assertEquals("/", SteamAuthController.localPath("@evil.com"));
        assertEquals("/", SteamAuthController.localPath("/seasons/a b"));
    }
}
