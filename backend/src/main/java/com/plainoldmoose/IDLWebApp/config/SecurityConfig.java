package com.plainoldmoose.IDLWebApp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain springFilterChain(HttpSecurity http) throws Exception {
        // First match wins, so the admin rule must come before the /api/** permitAll
        return http.authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/players", "/api/seasons").hasRole("ADMIN")
                        .requestMatchers("/auth/**", "/api/**").permitAll()
                        .anyRequest().authenticated())
                .csrf(csrf -> csrf.disable())
                .securityContext(context -> context.requireExplicitSave(false))
                .build();
    }
}
