package com.plainoldmoose.IDLWebApp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class SteamAuthService {
    public static final String STEAM_LOGIN = "https://steamcommunity.com/openid/login";
    private static final Pattern CLAIMED_ID = Pattern.compile("https://steamcommunity\\.com/openid/id/(\\d{17})");

    // Without timeouts a slow Steam holds a server thread per login attempt for as long as it stalls
    private final RestTemplate restTemplate = new RestTemplate(steamTimeouts());

    private static SimpleClientHttpRequestFactory steamTimeouts() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(5));
        return factory;
    }

    // The SteamID64 of a Steam login made for this site, empty otherwise. Steam's check only proves that Steam
    // signed the login, so without the return_to check a login to any other Steam site could be replayed here
    public Optional<String> verify(Map<String, String> params, String callbackUrl) {
        Matcher claimedId = CLAIMED_ID.matcher(params.getOrDefault("openid.claimed_id", ""));
        // Fields left out of openid.signed can be changed without breaking the signature
        List<String> signed = List.of(params.getOrDefault("openid.signed", "").split(","));

        boolean forThisSite = claimedId.matches()
                && STEAM_LOGIN.equals(params.get("openid.op_endpoint"))
                && params.getOrDefault("openid.return_to", "").startsWith(callbackUrl + "?")
                && signed.containsAll(List.of("claimed_id", "return_to", "op_endpoint", "response_nonce"))
                && isFresh(params.getOrDefault("openid.response_nonce", ""));

        return forThisSite && checkWithSteam(params) ? Optional.of(claimedId.group(1)) : Optional.empty();
    }

    // The nonce starts with the UTC time Steam issued it, so an old one is a callback URL replayed from a log
    // or browser history
    private static boolean isFresh(String nonce) {
        try {
            return Instant.parse(nonce.substring(0, 20)).isAfter(Instant.now().minus(Duration.ofMinutes(5)));
        } catch (IndexOutOfBoundsException | DateTimeParseException e) {
            return false;
        }
    }

    // Protected so tests can stand in for Steam
    protected boolean checkWithSteam(Map<String, String> params) {
        try {
            // Posted as application/x-www-form-urlencoded, encoded by RestTemplate
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            params.forEach(form::add);
            form.set("openid.mode", "check_authentication");

            String body = restTemplate.postForObject(STEAM_LOGIN, form, String.class);
            return body != null && body.contains("is_valid:true");
        } catch (
                Exception e) {
            log.error("Steam verification failed", e);
            return false;
        }
    }
}
