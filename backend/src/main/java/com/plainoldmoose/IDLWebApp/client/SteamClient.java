package com.plainoldmoose.IDLWebApp.client;

import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GamePlayer;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.ArrayList;
import java.util.List;

// Steam's Web API, for the games on a league ticket. OpenDota doesn't list amateur leagues' games, and Steam's own
// match details endpoint is broken, so each game's details still come from OpenDota
@Component
public class SteamClient {

    private final RestClient restClient;
    private final String apiKey;

    // Boot 4 only provides a RestClient.Builder bean with the separate restclient starter, so this builds its own
    @Autowired
    public SteamClient(@Value("${app.steam.api-key:}") String apiKey,
                       @Value("${app.steam.base-url:https://api.steampowered.com}") String baseUrl) {
        this(RestClient.builder(), apiKey, baseUrl);
    }

    // Tests pass a builder bound to a mock server
    public SteamClient(RestClient.Builder builder, String apiKey, String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.apiKey = apiKey;
    }

    // Steam's account ID for a player who keeps their match history private
    private static final long PRIVATE_ACCOUNT = 4294967295L;
    private static final int PAGE_SIZE = 100;

    // Every game on a league ticket, newest first
    public List<LeagueGame> leagueMatches(long leagueId) {
        if (apiKey == null || apiKey.isBlank()) throw new RestClientException("Steam API key isn't set");
        List<LeagueGame> games = new ArrayList<>();
        Long startAt = null;
        while (true) {
            History page = page(leagueId, startAt);
            List<RawGame> matches = page.matches() == null ? List.of() : page.matches();
            matches.forEach(game -> games.add(new LeagueGame(game.matchId(), game.startTime(), game.players() == null ? List.of() : game.players()
                    .stream()
                    .map(player -> new GamePlayer(player.accountId() == null || player.accountId() == PRIVATE_ACCOUNT
                            ? null : OpenDotaClient.steamId(player.accountId()), player.teamNumber() == 0))
                    .toList())));
            if (page.resultsRemaining() <= 0 || matches.isEmpty()) return games;
            startAt = matches.get(matches.size() - 1).matchId() - 1;
        }
    }

    private History page(long leagueId, Long startAt) {
        try {
            Response response = restClient.get().uri(uri -> {
                uri.path("/IDOTA2Match_570/GetMatchHistory/v1/")
                        .queryParam("key", apiKey)
                        .queryParam("league_id", leagueId)
                        .queryParam("matches_requested", PAGE_SIZE);
                if (startAt != null) uri.queryParam("start_at_match_id", startAt);
                return uri.build();
            }).retrieve().body(Response.class);
            if (response != null && response.result() != null) return response.result();
        } catch (RestClientException e) {
            // NOTE: the cause is dropped on purpose: its message has the URL, and the URL has the key
        }
        throw new RestClientException("Couldn't reach Steam");
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record Response(History result) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record History(@JsonProperty("results_remaining") int resultsRemaining, List<RawGame> matches) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawGame(@JsonProperty("match_id") long matchId, @JsonProperty("start_time") long startTime, List<RawPlayer> players) {
    }

    // team_number 0 is Radiant, 1 Dire
    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawPlayer(@JsonProperty("account_id") Long accountId, @JsonProperty("team_number") int teamNumber) {
    }

    // startTime is in Unix seconds. Players' Steam IDs are null for private profiles
    public record LeagueGame(long matchId, long startTime, List<GamePlayer> players) {
    }
}
