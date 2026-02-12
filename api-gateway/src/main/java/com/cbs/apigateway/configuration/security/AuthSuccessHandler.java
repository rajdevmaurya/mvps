package com.cbs.apigateway.configuration.security;

import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.server.authentication.RedirectServerAuthenticationSuccessHandler;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.security.web.server.WebFilterExchange;

import reactor.core.publisher.Mono;

@Component
public class AuthSuccessHandler implements ServerAuthenticationSuccessHandler {

    private final ServerOAuth2AuthorizedClientRepository authorizedClientRepository;
    private final RedirectServerAuthenticationSuccessHandler delegate = new RedirectServerAuthenticationSuccessHandler("/");

    public AuthSuccessHandler(ServerOAuth2AuthorizedClientRepository authorizedClientRepository) {
        this.authorizedClientRepository = authorizedClientRepository;
    }

    @Override
    public Mono<Void> onAuthenticationSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        ServerWebExchange exchange = webFilterExchange.getExchange();
        if (authentication instanceof OAuth2AuthenticationToken) {
            OAuth2AuthenticationToken oauth2 = (OAuth2AuthenticationToken) authentication;
            return authorizedClientRepository.loadAuthorizedClient(oauth2.getAuthorizedClientRegistrationId(), oauth2, exchange)
                    .flatMap(ac -> {
                        if (ac != null && ac.getRefreshToken() != null) {
                            var rt = ac.getRefreshToken().getTokenValue();
                            ResponseCookie rc = ResponseCookie.from("refresh_token", rt)
                                    .httpOnly(true)
                                    .secure(true)
                                    .path("/")
                                    .sameSite("Lax")
                                    .maxAge(Duration.ofDays(30))
                                    .build();
                            exchange.getResponse().addCookie(rc);
                        }
                        return delegate.onAuthenticationSuccess(webFilterExchange, authentication);
                    })
                    .switchIfEmpty(delegate.onAuthenticationSuccess(webFilterExchange, authentication));
        }
        return delegate.onAuthenticationSuccess(webFilterExchange, authentication);
    }

}
