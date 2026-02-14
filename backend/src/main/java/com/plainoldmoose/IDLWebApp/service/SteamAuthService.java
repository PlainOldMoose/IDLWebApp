package com.plainoldmoose.IDLWebApp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SteamAuthService {
    private final RestTemplate restTemplate = new RestTemplate();

    public boolean verifyResponse(Map<String, String> params) {
        try {
            Map<String, String> verifyParams = new HashMap<>(params);
            verifyParams.put("openid.mode", "check_authentication");

            String formData = verifyParams.entrySet()
                    .stream()
                    .map(e -> e.getKey() + "=" + URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8))
                    .collect(Collectors.joining("&"));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<String> request = new HttpEntity<>(formData, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    "https://steamcommunity.com/openid/login",
                    request,
                    String.class
            );

            return response.getBody() != null && response.getBody()
                    .contains("is_valid:true");
        } catch (
                Exception e) {
            log.error("Steam verification failed", e);
            return false;
        }
    }

    public String extractSteamId(String claimedId) {
        if (claimedId == null) {
            return null;
        }
        return claimedId.replace("https://steamcommunity.com/openid/id/", "");
    }
}
