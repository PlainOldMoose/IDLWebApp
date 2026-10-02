package com.plainoldmoose.IDLWebApp.config;

import com.plainoldmoose.IDLWebApp.controller.InhouseController;
import com.plainoldmoose.IDLWebApp.controller.SeasonController;
import com.plainoldmoose.IDLWebApp.service.InhouseService;
import com.plainoldmoose.IDLWebApp.service.SeasonService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// SecurityConfig's rule order is the whole authorisation model, so these pin down who gets through to what
@WebMvcTest({SeasonController.class, InhouseController.class})
@Import(SecurityConfig.class)
class SecurityConfigTest {

    private static final String SEASON = "/api/seasons/" + UUID.randomUUID();
    private static final RequestPostProcessor PLAYER = user("76561198000000000").roles("USER");
    private static final RequestPostProcessor ADMIN = user("76561198000000001").roles("USER", "ADMIN");

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private SeasonService seasonService;

    @MockitoBean
    private InhouseService inhouseService;

    @Test
    void anyoneCanRead() throws Exception {
        mvc.perform(get("/api/seasons")).andExpect(status().isOk());
    }

    @Test
    void signedOutVisitorCantWrite() throws Exception {
        mvc.perform(delete("/api/inhouses/1").with(csrf())).andExpect(status().isForbidden());
    }

    @Test
    void playerCanUseInhouses() throws Exception {
        mvc.perform(delete("/api/inhouses/1").with(PLAYER).with(csrf())).andExpect(status().isNoContent());
    }

    @Test
    void playerCantDoAdminWrites() throws Exception {
        mvc.perform(delete(SEASON).with(PLAYER).with(csrf())).andExpect(status().isForbidden());
    }

    @Test
    void adminCanDoAdminWrites() throws Exception {
        mvc.perform(delete(SEASON).with(ADMIN).with(csrf())).andExpect(status().isNoContent());
    }

    @Test
    void onlyAdminsSeeOrApproveTheQueue() throws Exception {
        mvc.perform(get("/api/inhouses/pending")).andExpect(status().isForbidden());
        mvc.perform(get("/api/inhouses/pending").with(PLAYER)).andExpect(status().isForbidden());
        mvc.perform(post("/api/inhouses/1/approve").with(PLAYER).with(csrf())).andExpect(status().isForbidden());
    }

    @Test
    void adminCanSeeAndApproveTheQueue() throws Exception {
        mvc.perform(get("/api/inhouses/pending").with(ADMIN)).andExpect(status().isOk());
        mvc.perform(post("/api/inhouses/1/approve").with(ADMIN).with(csrf())).andExpect(status().isNoContent());
    }

    @Test
    void writesNeedCsrfToken() throws Exception {
        mvc.perform(delete(SEASON).with(ADMIN)).andExpect(status().isForbidden());
    }
}
