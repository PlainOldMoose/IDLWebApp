package com.plainoldmoose.IDLWebApp.client;

import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GameDetails;
import com.plainoldmoose.IDLWebApp.client.OpenDotaClient.GamePlayer;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

// Trimmed copies of OpenDota's real responses, so a change to what we read from them shows up here
class OpenDotaClientTest {

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final OpenDotaClient client = new OpenDotaClient(builder, "https://api.opendota.com/api");

    // account_id is the 32-bit Steam ID; private profiles come back as null. Behaviour 35: kills and last hits are
    // summed, and only leaver status 2 or more is an abandon (1 is disconnecting as the game ended)
    @Test
    void readsAGamesPlayersAsSteamIds() {
        server.expect(requestTo("https://api.opendota.com/api/matches/7406531302")).andRespond(withSuccess("""
                {"match_id":7406531302,"radiant_win":false,"start_time":1698621223,"duration":2525,"leagueid":15728,"players":[
                  {"account_id":91730177,"isRadiant":true,"player_slot":0,"kills":7,"last_hits":180,"leaver_status":1},
                  {"account_id":null,"isRadiant":false,"player_slot":128,"kills":3,"last_hits":95,"leaver_status":3},
                  {"account_id":116934015,"isRadiant":true,"player_slot":1,"kills":2,"last_hits":40,"leaver_status":0},
                  {"account_id":97590558,"isRadiant":false,"player_slot":129,"kills":0,"last_hits":12,"leaver_status":2}]}
                """, MediaType.APPLICATION_JSON));

        assertEquals(Optional.of(new GameDetails(1698621223L, false,
                        List.of(new GamePlayer("76561198051995905", true), new GamePlayer(null, false),
                                new GamePlayer("76561198077199743", true), new GamePlayer("76561198057856286", false)),
                        2525, 12, 327, 2)),
                client.match(7406531302L));
    }

    // Behaviour 27: a game OpenDota hasn't fetched yet
    @Test
    void gameItDoesntHaveIsEmpty() {
        server.expect(requestTo("https://api.opendota.com/api/matches/9037005272"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND).body("{\"error\":\"Not Found\"}").contentType(MediaType.APPLICATION_JSON));

        assertEquals(Optional.empty(), client.match(9037005272L));
    }

    @Test
    void otherFailuresSayOpenDotaCouldntBeReached() {
        server.expect(requestTo("https://api.opendota.com/api/matches/9037005272")).andRespond(withStatus(HttpStatus.BAD_GATEWAY));

        RestClientException e = assertThrows(RestClientException.class, () -> client.match(9037005272L));
        assertEquals("Couldn't reach OpenDota", e.getMessage());
    }

    // Behaviour 28
    @Test
    void asksForAGameToBeFetched() {
        server.expect(requestTo("https://api.opendota.com/api/request/9037005272"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess("{\"job\":{\"jobId\":1}}", MediaType.APPLICATION_JSON));

        client.requestParse(9037005272L);

        server.verify();
    }
}
