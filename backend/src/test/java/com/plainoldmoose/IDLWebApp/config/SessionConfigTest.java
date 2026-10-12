package com.plainoldmoose.IDLWebApp.config;

import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.springframework.core.convert.ConversionFailedException;
import org.springframework.core.convert.ConversionService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;

import java.util.List;

import static java.nio.charset.StandardCharsets.UTF_8;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SessionConfigTest {
    private final ConversionService conversion = new SessionConfig().springSessionConversionService();

    private Object roundTrip(Object value) {
        return conversion.convert(conversion.convert(value, byte[].class), Object.class);
    }

    @Test
    void storesSignInAndSessionValues() {
        SecurityContext context = new SecurityContextImpl(new UsernamePasswordAuthenticationToken("76561198000000000",
                null, List.of(new SimpleGrantedAuthority("ROLE_USER"), new SimpleGrantedAuthority("ROLE_ADMIN"))));

        Authentication restored = ((SecurityContext) roundTrip(context)).getAuthentication();
        assertEquals("76561198000000000", restored.getName());
        assertEquals(context.getAuthentication().getAuthorities(), restored.getAuthorities());
        assertTrue(restored.isAuthenticated());
        assertEquals("login-state", roundTrip("login-state"));
        assertEquals(1793746326301L, ((Number) roundTrip(1793746326301L)).longValue());
    }

    // A row edited in the database to name some other class must not become an instance of it, at the top or nested
    @Test
    void refusesClassesOutsideTheAllowlist() {
        for (String tampered : List.of(
                "{\"@class\":\"java.io.File\",\"path\":\"/etc/passwd\"}",
                "{\"@class\":\"org.springframework.security.core.context.SecurityContextImpl\","
                        + "\"authentication\":{\"@class\":\"java.io.File\",\"path\":\"/etc/passwd\"}}")) {
            assertThrows(ConversionFailedException.class, () -> conversion.convert(tampered.getBytes(UTF_8), Object.class));
        }
    }

    private static HttpSession createdAgo(long millis) {
        HttpSession session = mock(HttpSession.class);
        when(session.getCreationTime()).thenReturn(System.currentTimeMillis() - millis);
        return session;
    }

    @Test
    void keepsSessionYoungerThanTheLimit() {
        HttpSession session = createdAgo(SessionConfig.MAX_AGE.toMillis() - 60_000);
        SessionConfig.endIfTooOld(session);
        verify(session, never()).invalidate();
    }

    @Test
    void endsSessionOlderThanTheLimit() {
        HttpSession session = createdAgo(SessionConfig.MAX_AGE.toMillis() + 60_000);
        SessionConfig.endIfTooOld(session);
        verify(session).invalidate();
    }
}
