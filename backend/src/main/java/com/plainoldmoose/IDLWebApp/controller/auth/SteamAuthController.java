package com.plainoldmoose.IDLWebApp.controller.auth;

import com.plainoldmoose.IDLWebApp.dto.response.auth.SteamUserResponse;
import com.plainoldmoose.IDLWebApp.repository.PlayerRepository;
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

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class SteamAuthController {

    private final SteamAuthService steamAuthService;
    private final PlayerRepository playerRepository;

    @Value("${app.base-url}")
    private String baseUrl;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/login")
    public ResponseEntity<Void> login() {
        String returnUrl = baseUrl + "/auth/callback";

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
        if (!params.containsKey("openid.claimed_id") || !params.containsKey("openid.sig")) {
            return ResponseEntity.badRequest().build();
        }

        if (!steamAuthService.verifyResponse(params)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        String steamId = steamAuthService.extractSteamId(params.get("openid.claimed_id"));

        if (!playerRepository.existsById(steamId)) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(frontendUrl + "?error=unregistered"))
                    .build();
        }

        Authentication auth = new UsernamePasswordAuthenticationToken(steamId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));

        SecurityContextHolder.getContext()
                .setAuthentication(auth);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendUrl))
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<SteamUserResponse> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String steamId = (String) auth.getPrincipal();
        return playerRepository.findById(steamId)
                .map(player -> ResponseEntity.ok(new SteamUserResponse(player.getSteamId(), player.getUsername())))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
}
