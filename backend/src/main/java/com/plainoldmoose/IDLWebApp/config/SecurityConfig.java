package com.plainoldmoose.IDLWebApp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Value("${app.admin.credentials}")
    private String adminCredentials;

    @Value("${app.cors.allowed-origins}")
    private String corsAllowedOrigins;

    private static final String ADMIN_ROLE = "ADMIN";
    private static final String API_PATH = "/api/**";

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable()) // Disable for API simplicity, or configure properly
                .authorizeHttpRequests(auth -> auth
                        // Public read endpoints
                        .requestMatchers(HttpMethod.GET, "/api/players/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/matches/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/seasons/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/teams/**").permitAll()

                        // Auth endpoints
                        .requestMatchers("/api/auth/**").permitAll()

                        // Admin write endpoints (POST, PUT, DELETE)
                        .requestMatchers(HttpMethod.POST, API_PATH).hasRole(ADMIN_ROLE)
                        .requestMatchers(HttpMethod.PUT, API_PATH).hasRole(ADMIN_ROLE)
                        .requestMatchers(HttpMethod.DELETE, API_PATH).hasRole(ADMIN_ROLE)

                        // Admin dashboard stats
                        .requestMatchers("/api/admin/**").hasRole(ADMIN_ROLE)

                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        List<UserDetails> users = new ArrayList<>();

        // Parse credentials from env var: "user1:pass1,user2:pass2,user3:pass3"
        for (String credential : adminCredentials.split(",")) {
            String[] parts = credential.trim().split(":");
            if (parts.length == 2) {
                users.add(User.builder()
                        .username(parts[0].trim())
                        .password(passwordEncoder.encode(parts[1].trim()))
                        .roles(ADMIN_ROLE)
                        .build());
            }
        }

        return new InMemoryUserDetailsManager(users);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(corsAllowedOrigins.split(",")));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
