package com.cbs.finance.config;

import static org.springframework.security.config.Customizer.withDefaults;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.session.SessionRegistryImpl;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.OAuth2Token;
import org.springframework.security.oauth2.server.authorization.OAuth2AuthorizationService;
import org.springframework.security.oauth2.server.authorization.client.RegisteredClientRepository;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configurers.OAuth2AuthorizationServerConfigurer;
import org.springframework.security.oauth2.server.authorization.token.OAuth2TokenGenerator;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.session.HttpSessionEventPublisher;
import org.springframework.security.web.util.matcher.MediaTypeRequestMatcher;

@Configuration
public class SecurityConfig {
	
	
	@Bean 
	@Order(1)
	SecurityFilterChain authorizationServerSecurityFilterChain(
			HttpSecurity http, 
			RegisteredClientRepository registeredClientRepository,
			OAuth2AuthorizationService authorizationService, 
			SessionRegistry sessionRegistry,
			OAuth2TokenGenerator<? extends OAuth2Token> tokenGenerator)
			throws Exception {
		OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
		http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
			.tokenEndpoint(token -> token
					.authenticationProvider(new MyOAuth2RefreshTokenAuthenticationProvider(
							authorizationService, 
							tokenGenerator)))
			.authorizationEndpoint(authz -> authz
			.consentPage("/oauth2/consent"))
			.oidc(oidc -> oidc
					.logoutEndpoint(logout -> logout
							.authenticationProvider(new MyOidcLogoutAuthenticationProvider(
									registeredClientRepository, 
									authorizationService, sessionRegistry))));
		http.exceptionHandling((exceptions) -> exceptions
				.defaultAuthenticationEntryPointFor(
					new LoginUrlAuthenticationEntryPoint("/login"),
					new MediaTypeRequestMatcher(MediaType.TEXT_HTML)
				)
			)
			.oauth2ResourceServer((resourceServer) -> resourceServer
				.jwt(withDefaults()));

		return http.build();
	}

	/*
	@Bean 
	@Order(3)
	SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
		OAuth2AuthorizationServerConfiguration.applyDefaultSecurity(http);
		http.getConfigurer(OAuth2AuthorizationServerConfigurer.class)
			.authorizationEndpoint(authz -> authz
					.consentPage("/oauth2/consent"))
			.oidc(withDefaults());
		http
			.exceptionHandling((exceptions) -> exceptions
				.defaultAuthenticationEntryPointFor(
					new LoginUrlAuthenticationEntryPoint("/login"),
					new MediaTypeRequestMatcher(MediaType.TEXT_HTML)
				)
			)
			.oauth2ResourceServer((resourceServer) -> resourceServer
				.jwt(withDefaults()));

		return http.build();
	} */

	@Bean 
	@Order(2)
	SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http)
			throws Exception {
		http
			.authorizeHttpRequests((authorize) -> authorize
				.requestMatchers("/error", "/login").permitAll()
				.anyRequest().authenticated())
			.formLogin(formLogin -> formLogin
					.loginPage("/login")
			);
		return http.build();
	}
	
	@Bean
	WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.debug(false)
                .ignoring()
                .requestMatchers("/webjars/**", "/images/**", "/css/**", "/assets/**", "/favicon.ico");
    }
	
	@Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
	@Bean
	SessionRegistry sessionRegistry() {
		return new SessionRegistryImpl();
	}

	@Bean
	HttpSessionEventPublisher httpSessionEventPublisher() {
		return new HttpSessionEventPublisher();
	}
}
