package com.plainoldmoose.IDLWebApp.client;

import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GamePlayer;
import com.plainoldmoose.IDLWebApp.client.SteamClient.LeagueGame;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.ExpectedCount.never;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.anything;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

// Trimmed copies of Steam's real GetMatchHistory responses
class SteamClientTest {

    private static final String KEY = "TESTKEY0123456789";
    private static final String HISTORY = "https://api.steampowered.com/IDOTA2Match_570/GetMatchHistory/v1/";

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

    private SteamClient client(String key) {
        return new SteamClient(builder, key, "https://api.steampowered.com");
    }

    // Behaviour 23: team_number 0 is Radiant; 4294967295 is Steam's stand-in for a private profile
    @Test
    void readsATicketsGamesWithTheirPlayers() {
        server.expect(requestTo(org.hamcrest.Matchers.startsWith(HISTORY)))
                .andExpect(queryParam("key", KEY))
                .andExpect(queryParam("league_id", "20253"))
                .andExpect(queryParam("matches_requested", "100"))
                .andRespond(withSuccess("""
                        {"result":{"status":1,"num_results":1,"total_results":1,"results_remaining":0,"matches":[
                          {"series_id":0,"series_type":0,"match_id":9037005272,"match_seq_num":7596413095,"start_time":1791572151,
                           "lobby_type":1,"radiant_team_id":0,"dire_team_id":0,"players":[
                             {"account_id":36258336,"player_slot":0,"team_number":0,"team_slot":0,"hero_id":1},
                             {"account_id":4294967295,"player_slot":128,"team_number":1,"team_slot":0,"hero_id":2}]}]}}
                        """, MediaType.APPLICATION_JSON));

        assertEquals(List.of(new LeagueGame(9037005272L, 1791572151L,
                        List.of(new GamePlayer("76561197996524064", true), new GamePlayer(null, false)))),
                client(KEY).leagueMatches(20253));
    }

    // Behaviour 24: 100 games a page, newest first, so the next page starts below the last one
    @Test
    void followsPagesToTheEnd() {
        server.expect(requestTo(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("start_at_match_id"))))
                .andRespond(withSuccess("""
                        {"result":{"status":1,"results_remaining":1,"matches":[{"match_id":300,"start_time":3,"players":[]}]}}
                        """, MediaType.APPLICATION_JSON));
        server.expect(queryParam("start_at_match_id", "299"))
                .andRespond(withSuccess("""
                        {"result":{"status":1,"results_remaining":0,"matches":[{"match_id":200,"start_time":2,"players":[]}]}}
                        """, MediaType.APPLICATION_JSON));

        assertEquals(List.of(300L, 200L), client(KEY).leagueMatches(20253).stream().map(LeagueGame::matchId).toList());
        server.verify();
    }

    // Behaviour 25
    @Test
    void needsAKey() {
        server.expect(never(), anything());

        RestClientException e = assertThrows(RestClientException.class, () -> client("").leagueMatches(20253));

        assertEquals("Steam API key isn't set", e.getMessage());
        server.verify();
    }

    // Behaviour 26: the key is in the URL, so the error that reaches the panel and the log mustn't carry it
    @Test
    void steamFailingDoesntLeakTheKey() {
        server.expect(requestTo(org.hamcrest.Matchers.startsWith(HISTORY))).andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        RestClientException e = assertThrows(RestClientException.class, () -> client(KEY).leagueMatches(20253));

        assertEquals("Couldn't reach Steam", e.getMessage());
        assertNull(e.getCause());
    }
}
