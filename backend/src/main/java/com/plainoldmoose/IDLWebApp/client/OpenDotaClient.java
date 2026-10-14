package com.plainoldmoose.IDLWebApp.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Optional;

// OpenDota's public API: free, no key, 60 calls a minute and 3000 a day
@Component
public class OpenDotaClient {

    private final RestClient restClient;

    // Boot 4 only provides a RestClient.Builder bean with the separate restclient starter, so this builds its own
    @Autowired
    public OpenDotaClient(@Value("${app.opendota.base-url:https://api.opendota.com/api}") String baseUrl) {
        this(RestClient.builder(), baseUrl);
    }

    // Tests pass a builder bound to a mock server
    public OpenDotaClient(RestClient.Builder builder, String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    // The gap between a 32-bit Steam account ID, which Dota uses, and the 64-bit one players sign in with
    private static final long STEAM_ID_64_BASE = 76561197960265728L;

    // Leaver statuses from here up mean leaving before the end: disconnected too long, abandoned, AFK, never connected.
    // 1 is disconnecting as the game ended, which lobbies do all the time
    private static final int ABANDONED = 2;

    static String steamId(long accountId) {
        return String.valueOf(accountId + STEAM_ID_64_BASE);
    }

    // Empty when OpenDota hasn't fetched the game yet
    public Optional<GameDetails> match(long matchId) {
        RawGame game;
        try {
            game = restClient.get().uri("/matches/{id}", matchId).retrieve().body(RawGame.class);
        } catch (HttpClientErrorException.NotFound e) {
            return Optional.empty();
        } catch (RestClientException e) {
            throw new RestClientException("Couldn't reach OpenDota", e);
        }
        if (game == null) throw new RestClientException("Couldn't reach OpenDota");
        List<RawPlayer> players = game.players() == null ? List.of() : game.players();
        return Optional.of(new GameDetails(game.startTime(), game.radiantWin(), players.stream()
                .map(player -> new GamePlayer(player.accountId() == null ? null : steamId(player.accountId()), player.radiant()))
                .toList(),
                game.duration(),
                players.stream().mapToInt(RawPlayer::kills).sum(),
                players.stream().mapToInt(RawPlayer::lastHits).sum(),
                (int) players.stream().filter(player -> player.leaverStatus() >= ABANDONED).count()));
    }

    // Asks OpenDota to fetch a game it doesn't have, so a later match() finds it
    public void requestParse(long matchId) {
        try {
            restClient.post().uri("/request/{id}", matchId).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            throw new RestClientException("Couldn't reach OpenDota", e);
        }
    }

    // OpenDota's own field names
    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawGame(@JsonProperty("start_time") long startTime,
                           @JsonProperty("radiant_win") boolean radiantWin, int duration, List<RawPlayer> players) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record RawPlayer(@JsonProperty("account_id") Long accountId, @JsonProperty("isRadiant") boolean radiant, int kills,
                             @JsonProperty("last_hits") int lastHits, @JsonProperty("leaver_status") int leaverStatus) {
    }

    // startTime is in Unix seconds and duration in seconds. kills and lastHits are both teams' totals; abandons counts
    // players who left before the end (leaver status 2 or more)
    public record GameDetails(long startTime, boolean radiantWin, List<GamePlayer> players,
                              int duration, int kills, int lastHits, int abandons) {
    }

    // steamId is null for a private profile
    public record GamePlayer(String steamId, boolean radiant) {
    }
}
