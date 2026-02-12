package com.cbs.apigateway.configuration.security;
import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.client.oidc.web.server.logout.OidcClientInitiatedServerLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers;
import org.springframework.security.oauth2.client.web.server.DefaultServerOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizationRequestResolver;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
public class SecurityConfig {

	private final ReactiveClientRegistrationRepository reactiveClientRegistrationRepository;
	
	public SecurityConfig(ReactiveClientRegistrationRepository reactiveClientRegistrationRepository) {
		this.reactiveClientRegistrationRepository = reactiveClientRegistrationRepository;
	}

	@Bean
	SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http, ServerOAuth2AuthorizationRequestResolver resolver, org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler authSuccessHandler) {
		return http
				.csrf(csrf -> csrf.disable())
				.cors(cors -> cors.disable())
                .authorizeExchange(exchange -> exchange
                		.pathMatchers("/**").permitAll()
                		.anyExchange().authenticated())
				.oauth2Login(auth -> auth
					.authorizationRequestResolver(resolver)
					.authenticationSuccessHandler(authSuccessHandler))
                .oauth2Client(withDefaults())
                .logout(logout -> logout
                		.logoutUrl("/logout")
                		.logoutSuccessHandler(serverLogoutSuccessHandler(reactiveClientRegistrationRepository)))
                .build();
    }
	
	@Bean
	ServerLogoutSuccessHandler serverLogoutSuccessHandler(ReactiveClientRegistrationRepository repository) {
	       OidcClientInitiatedServerLogoutSuccessHandler oidcLogoutSuccessHandler = new OidcClientInitiatedServerLogoutSuccessHandler(repository);
	       oidcLogoutSuccessHandler.setPostLogoutRedirectUri("{baseUrl}/logged-out");
	       return oidcLogoutSuccessHandler;
	}
	
	@Bean
	ServerOAuth2AuthorizationRequestResolver pkceResolver(ReactiveClientRegistrationRepository repo) {
	    var resolver = new DefaultServerOAuth2AuthorizationRequestResolver(repo);
	    resolver.setAuthorizationRequestCustomizer(OAuth2AuthorizationRequestCustomizers.withPkce());
	    return resolver;
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(@Value("${app.cors.allowed-origins:http://localhost:4200}") String allowedOrigin) {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(List.of(allowedOrigin));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true);
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}
	
}