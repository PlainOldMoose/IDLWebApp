package com.plainoldmoose.IDLWebApp.config;

import com.plainoldmoose.IDLWebApp.controller.SeasonController;
import com.plainoldmoose.IDLWebApp.dto.response.auth.SteamUserResponse;
import com.plainoldmoose.IDLWebApp.service.PlayerService;
import com.plainoldmoose.IDLWebApp.service.SeasonService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// The frontend shows a problem's detail as-is, so Spring's own wording ("No static resource ...") mustn't reach it
@WebMvcTest(SeasonController.class)
@Import(SecurityConfig.class)
class ErrorMessagesTest {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private SeasonService seasonService;

    @MockitoBean
    private PlayerService playerService;

    @Test
    void unknownEndpointSaysSoPlainly() throws Exception {
        when(playerService.findSteamUser("76561198000000001"))
                .thenReturn(Optional.of(new SteamUserResponse("76561198000000001", "admin", true, false)));
        mvc.perform(post("/api/no-such-endpoint").with(csrf()).with(user("76561198000000001").roles("USER", "ADMIN")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("The server doesn't support that yet. It may be running an older version."));
    }
}
