package com.plainoldmoose.IDLWebApp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class SteamAuthService {
    private final RestTemplate restTemplate = new RestTemplate();

    public boolean verifyResponse(Map<String, String> params) {
        try {
            // Posted as application/x-www-form-urlencoded, encoded by RestTemplate
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            params.forEach(form::add);
            form.set("openid.mode", "check_authentication");

            String body = restTemplate.postForObject("https://steamcommunity.com/openid/login", form, String.class);
            return body != null && body.contains("is_valid:true");
        } catch (
                Exception e) {
            log.error("Steam verification failed", e);
            return false;
        }
    }

    public String extractSteamId(String claimedId) {
        return claimedId.replace("https://steamcommunity.com/openid/id/", "");
    }
}
