package com.plainoldmoose.IDLWebApp.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain springFilterChain(HttpSecurity http) throws Exception {
        // First match wins. Reads are public, signing up needs a signed-in player, and every other write is
        // admin-only, so a new write endpoint stays locked until a rule here opens it
        return http.authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/seasons/*/signups").authenticated()
                        .requestMatchers("/api/**").hasRole("ADMIN")
                        .requestMatchers("/auth/**").permitAll()
                        .anyRequest().authenticated())
                // Sets a readable XSRF-TOKEN cookie; the frontend echoes it back as an X-XSRF-TOKEN header on writes
                .csrf(csrf -> csrf.spa())
                .logout(logout -> logout.logoutUrl("/auth/logout")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
                .securityContext(context -> context.requireExplicitSave(false))
                .build();
    }
}
