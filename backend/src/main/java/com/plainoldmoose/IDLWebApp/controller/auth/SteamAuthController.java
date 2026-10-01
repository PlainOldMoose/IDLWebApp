package com.plainoldmoose.IDLWebApp.controller.auth;

import com.plainoldmoose.IDLWebApp.dto.response.auth.SteamUserResponse;
import com.plainoldmoose.IDLWebApp.service.PlayerService;
import com.plainoldmoose.IDLWebApp.service.SteamAuthService;
import jakarta.servlet.http.HttpServletRequest;
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
import java.net.URLEncoder;
import java.util.List;
import java.util.Map;

import static java.nio.charset.StandardCharsets.UTF_8;

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
        String returnUrl = baseUrl + "/auth/callback?returnTo=" + URLEncoder.encode(localPath(returnTo), UTF_8);

        String steamLoginUrl = SteamAuthService.STEAM_LOGIN +
                "?openid.ns=http://specs.openid.net/auth/2.0" +
                "&openid.mode=checkid_setup" +
                "&openid.return_to=" + URLEncoder.encode(returnUrl, UTF_8) +
                "&openid.realm=" + URLEncoder.encode(baseUrl, UTF_8) +
                "&openid.identity=http://specs.openid.net/auth/2.0/identifier_select" +
                "&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select";

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(steamLoginUrl))
                .build();
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(@RequestParam Map<String, String> params, HttpServletRequest request) {
        String returnTo = localPath(params.getOrDefault("returnTo", "/"));

        String steamId = steamAuthService.verify(params, baseUrl + "/auth/callback")
                .orElse(null);
        if (steamId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        if (playerService.findSteamUser(steamId, false).isEmpty()) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(baseUrl + "/unregistered"))
                    .build();
        }

        List<SimpleGrantedAuthority> roles = adminSteamIds.contains(steamId)
                ? List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN"))
                : List.of(new SimpleGrantedAuthority("ROLE_USER"));
        Authentication auth = new UsernamePasswordAuthenticationToken(steamId, null, roles);

        // New session id at login, so a session id planted in the browser beforehand is useless afterwards
        if (request.getSession(false) != null) {
            request.changeSessionId();
        }
        SecurityContextHolder.getContext()
                .setAuthentication(auth);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(baseUrl + returnTo))
                .build();
    }

    // Paths on this site only: baseUrl + ".evil.com" or "@evil.com" would send the browser to evil.com.
    // A path that isn't a valid URI, e.g. one with a space, would make URI.create throw after a good login
    static String localPath(String path) {
        try {
            URI.create(path);
        } catch (IllegalArgumentException e) {
            return "/";
        }
        return path.startsWith("/") ? path : "/";
    }

    // authentication is null for anonymous requests
    @GetMapping("/me")
    public ResponseEntity<SteamUserResponse> me(Authentication authentication, HttpServletRequest request) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        return playerService.findSteamUser(authentication.getName(), request.isUserInRole("ADMIN"))
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not signed in"));
    }
}
