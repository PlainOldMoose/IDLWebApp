package com.plainoldmoose.IDLWebApp.controller.auth;

import com.plainoldmoose.IDLWebApp.dto.response.auth.SteamUserResponse;
import com.plainoldmoose.IDLWebApp.service.PlayerService;
import com.plainoldmoose.IDLWebApp.service.SteamAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class SteamAuthController {

    private final SteamAuthService steamAuthService;
    private final PlayerService playerService;

    // Where the frontend is served; /auth is proxied to this app on the same origin
    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.admin-steam-ids}")
    private List<String> adminSteamIds;

    @GetMapping("/login")
    public ResponseEntity<Void> login(@RequestParam(defaultValue = "/") String returnTo) {
        String returnUrl = baseUrl + "/auth/callback?returnTo=" + returnTo;

        String steamLoginUrl = "https://steamcommunity.com/openid/login" +
                "?openid.ns=http://specs.openid.net/auth/2.0" +
                "&openid.mode=checkid_setup" +
                "&openid.return_to=" + returnUrl +
                "&openid.realm=" + baseUrl +
                "&openid.identity=http://specs.openid.net/auth/2.0/identifier_select" +
                "&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select";

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(steamLoginUrl))
                .build();
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam Map<String, String> params) {
        String returnTo = params.getOrDefault("returnTo", "/");

        if (!params.containsKey("openid.claimed_id") || !params.containsKey("openid.sig")) {
            return ResponseEntity.badRequest()
                    .build();
        }

        if (!steamAuthService.verifyResponse(params)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        String steamId = steamAuthService.extractSteamId(params.get("openid.claimed_id"));

        if (playerService.findSteamUser(steamId, false).isEmpty()) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(baseUrl + "/unregistered"))
                    .build();
        }

        List<SimpleGrantedAuthority> roles = adminSteamIds.contains(steamId)
                ? List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN"))
                : List.of(new SimpleGrantedAuthority("ROLE_USER"));
        Authentication auth = new UsernamePasswordAuthenticationToken(steamId, null, roles);

        SecurityContextHolder.getContext()
                .setAuthentication(auth);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(baseUrl + returnTo))
                .build();
    }

    // authentication is null for anonymous requests
    @GetMapping("/me")
    public ResponseEntity<SteamUserResponse> me(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        boolean admin = authentication.getAuthorities()
                .contains(new SimpleGrantedAuthority("ROLE_ADMIN"));

        return playerService.findSteamUser(authentication.getName(), admin)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not signed in"));
    }
}
