package com.plainoldmoose.IDLWebApp.config;

import com.plainoldmoose.IDLWebApp.controller.SteamAuthController;
import com.plainoldmoose.IDLWebApp.service.PlayerService;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String ADMIN = "ADMIN";

    @Bean
    public SecurityFilterChain springFilterChain(HttpSecurity http, PlayerService playerService) {
        // First match wins. Reads are public, except the in-house approval queue. Signing up, draft picks, team names
        // and in-houses need a signed-in player. Every other write is admin-only, so a new write endpoint stays locked
        // until a rule here opens it
        return http.authorizeHttpRequests(auth -> auth
                        // Spring forwards a failed request to its error page; without this, anonymous users got a
                        // 403 for that forward instead of the real status, so a 500 looked like "forbidden"
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        // The approval queue: only admins see reported results or approve them into ELO
                        .requestMatchers(HttpMethod.GET, "/api/inhouses/pending").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.POST, "/api/inhouses/*/approve").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/seasons/*/signups").authenticated()
                        // SeasonSignupController only deletes the caller's own sign-up
                        .requestMatchers(HttpMethod.DELETE, "/api/seasons/*/signups").authenticated()
                        // DraftService checks it's the captain on the clock, or the team's own captain, or an admin
                        .requestMatchers(HttpMethod.POST, "/api/seasons/*/draft/picks").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/seasons/*/draft/teams/*").authenticated()
                        // InhouseService checks that only an in-house's own players, or an admin, report or cancel it
                        .requestMatchers("/api/inhouses/**").authenticated()
                        .requestMatchers("/api/**").hasRole(ADMIN)
                        .requestMatchers("/auth/**").permitAll()
                        .anyRequest().authenticated())
                // Sets a readable XSRF-TOKEN cookie; the frontend echoes it back as an X-XSRF-TOKEN header on writes
                .csrf(csrf -> csrf.spa())
                .logout(logout -> logout.logoutUrl("/auth/logout")
                        .logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
                .securityContext(context -> context.requireExplicitSave(false))
                // Saves a refused request to replay after login, which an API never does; without this every
                // anonymous request to a protected endpoint would create a session row
                .requestCache(cache -> cache.disable())
                .addFilterBefore(currentRoles(playerService), LogoutFilter.class)
                .build();
    }

    // Roles come from the player row on every request, not from sign-in, so admin is granted or revoked straight away
    // and a deleted player is signed out. Only rewrites the session when they changed.
    // NOTE: one primary-key lookup per signed-in request; cache it if that ever shows up
    private static OncePerRequestFilter currentRoles(PlayerService playerService) {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
                    throws ServletException, IOException {
                SecurityContext context = SecurityContextHolder.getContext();
                Authentication signedIn = context.getAuthentication();
                if (signedIn instanceof UsernamePasswordAuthenticationToken) {
                    Authentication current = playerService.findSteamUser(signedIn.getName())
                            .map(SteamAuthController::authenticationFor)
                            .orElse(null);
                    if (current == null || !current.getAuthorities().equals(signedIn.getAuthorities())) {
                        context.setAuthentication(current);
                    }
                }
                chain.doFilter(request, response);
            }
        };
    }
}
