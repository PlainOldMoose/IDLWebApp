package com.plainoldmoose.IDLWebApp.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.boot.security.autoconfigure.web.servlet.SecurityFilterProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.support.GenericConversionService;
import org.springframework.core.serializer.support.DeserializingConverter;
import org.springframework.core.serializer.support.SerializingConverter;
import org.springframework.security.jackson.SecurityJacksonModules;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.Duration;

@Configuration
public class SessionConfig {
    static final Duration MAX_AGE = Duration.ofDays(90);

    // Sessions are stored as JSON instead of Java serialization, so a row tampered with in the database can only
    // become one of Spring Security's allowlisted types, never an arbitrary class (deserialization exploit)
    @Bean
    public ConversionService springSessionConversionService() {
        JsonMapper mapper = JsonMapper.builder()
                .addModules(SecurityJacksonModules.getModules(SessionConfig.class.getClassLoader()))
                .build();
        GenericConversionService conversion = new GenericConversionService();
        conversion.addConverter(Object.class, byte[].class,
                new SerializingConverter((value, out) -> mapper.writeValue(out, value)));
        conversion.addConverter(byte[].class, Object.class,
                new DeserializingConverter(in -> mapper.readValue(in, Object.class)));
        return conversion;
    }

    // Each request restarts the 30-day idle timeout, so a stolen cookie in steady use would never expire.
    // This ends a session 90 days after sign-in whatever the activity. It runs before Spring Security loads the
    // session, so the request it ends is already anonymous
    @Bean
    public FilterRegistrationBean<OncePerRequestFilter> sessionAgeLimit() {
        FilterRegistrationBean<OncePerRequestFilter> registration = new FilterRegistrationBean<>(new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                    throws ServletException, IOException {
                endIfTooOld(request.getSession(false));
                chain.doFilter(request, response);
            }
        });
        registration.setOrder(SecurityFilterProperties.DEFAULT_FILTER_ORDER - 1);
        return registration;
    }

    // Counts from the session's creation, which is sign-in: CSRF lives in a cookie and the request cache is off, so
    // the first session a browser gets is the one /auth/login makes. An older session only makes the limit end sooner
    static void endIfTooOld(HttpSession session) {
        if (session != null && System.currentTimeMillis() - session.getCreationTime() >= MAX_AGE.toMillis()) {
            session.invalidate();
        }
    }
}
