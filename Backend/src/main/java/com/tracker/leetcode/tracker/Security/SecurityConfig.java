package com.tracker.leetcode.tracker.Security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // 1. Tell Spring Security to use our Master CORS config
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                .csrf(AbstractHttpConfigurer::disable)

                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint(customAuthenticationEntryPoint)
                )

                .authorizeHttpRequests(auth -> auth
                        // 2. Explicitly allow all preflight OPTIONS requests without a token!
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // TODO: /api/v1/auth/** is permitAll by design (login/register/refresh).
                        // The former insecure GET /api/v1/auth/make-admin privilege-escalation
                        // endpoint has been deleted; do not re-add admin promotion under permitAll.
                        // Any future admin-bootstrap endpoint must require SUPER_ADMIN.
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")

                        // Allow WebSocket Connections 
                        .requestMatchers("/ws-endpoint/**").permitAll()

                        // Mentor & Student Routes
                        .requestMatchers("/api/classrooms/**").hasAnyRole("MENTOR", "SUPER_ADMIN")
                        .requestMatchers("/api/paths/**").hasAnyRole("MENTOR", "SUPER_ADMIN")
                        .requestMatchers("/api/students/me/**").hasRole("STUDENT")

                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2LoginSuccessHandler)
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 3. The Master CORS Configuration Bean
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allow localhost and 127.0.0.1 on all ports
        configuration.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://localhost",
                "http://127.0.0.1:*",
                "http://127.0.0.1",
                "https://*.onrender.com"
        ));

        // Match Vite frontend and standard local ports
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost",
                "http://localhost:80",
                "http://127.0.0.1:5173",
                "http://127.0.0.1",
                "http://127.0.0.1:80"
        ));

        // Allow all standard HTTP methods, including OPTIONS and HEAD
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"));

        // Allow all request headers (Content-Type, Authorization, Accept, X-Requested-With, etc.)
        configuration.setAllowedHeaders(List.of("*"));

        // Expose headers needed by frontend
        configuration.setExposedHeaders(List.of("Authorization", "Set-Cookie"));

        // Crucial for secure cookies/tokens
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply these rules to every single endpoint in your app
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}