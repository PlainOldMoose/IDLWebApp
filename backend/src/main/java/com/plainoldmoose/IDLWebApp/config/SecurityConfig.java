package com.plainoldmoose.IDLWebApp.config;

import jakarta.servlet.DispatcherType;
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
        // First match wins. Reads are public except the in-house approval queue, signing up and in-houses need a
        // signed-in player, and every other write is admin-only, so a new write endpoint stays locked until a rule
        // here opens it
        return http.authorizeHttpRequests(auth -> auth
                        // Spring forwards a failed request to its error page; without this, anonymous users got a
                        // 403 for that forward instead of the real status, so a 500 looked like "forbidden"
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        // The approval queue: only admins see reported results or approve them into ELO
                        .requestMatchers(HttpMethod.GET, "/api/inhouses/pending").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/inhouses/*/approve").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/seasons/*/signups").authenticated()
                        // SeasonSignupController only deletes the caller's own sign-up
                        .requestMatchers(HttpMethod.DELETE, "/api/seasons/*/signups").authenticated()
                        // InhouseService checks that only an in-house's own players, or an admin, finish or cancel it
                        .requestMatchers("/api/inhouses/**").authenticated()
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
