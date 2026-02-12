package com.cbs.apigateway.controller;

import java.net.URI;
import java.time.Duration;
import java.util.Map;

import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final WebClient.Builder webClientBuilder;
    private final ReactiveClientRegistrationRepository clientRegistrationRepository;

    public AuthController(WebClient.Builder webClientBuilder,
                          ReactiveClientRegistrationRepository clientRegistrationRepository) {
        this.webClientBuilder = webClientBuilder;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    @PostMapping("/refresh")
    public Mono<Map> refresh(ServerHttpRequest request, ServerHttpResponse response) {
        // read refresh token from cookie named "refresh_token"
        HttpCookie cookie = request.getCookies().getFirst("refresh_token");
        if (cookie == null || cookie.getValue() == null || cookie.getValue().isBlank()) {
            return Mono.error(new RuntimeException("No refresh token cookie"));
        }
        final String refreshToken = cookie.getValue();

        return clientRegistrationRepository.findByRegistrationId("gateway")
                .flatMap(reg -> doRefresh(reg, refreshToken, response));
    }

    private Mono<Map> doRefresh(ClientRegistration reg, String refreshToken, ServerHttpResponse response) {
        String tokenUri = reg.getProviderDetails().getTokenUri();

        return webClientBuilder.build()
                .post()
                .uri(URI.create(tokenUri))
                .headers(h -> h.setBasicAuth(reg.getClientId(), reg.getClientSecret()))
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("grant_type", "refresh_token").with("refresh_token", refreshToken))
                .retrieve()
                .bodyToMono(Map.class)
                .flatMap(tokenResponse -> {
                    // rotate refresh token if present
                    Object newRefresh = tokenResponse.get("refresh_token");
                    if (newRefresh instanceof String && !((String) newRefresh).isBlank()) {
                        ResponseCookie rc = ResponseCookie.from("refresh_token", (String) newRefresh)
                                .httpOnly(true)
                                .secure(true)
                                .path("/")
                                .sameSite("Lax")
                                .maxAge(Duration.ofDays(30))
                                .build();
                        response.addCookie(rc);
                    }
                    return Mono.just(tokenResponse);
                });
    }

    @PostMapping("/logout")
    public Mono<Void> logout(ServerHttpResponse response) {
        // clear refresh cookie
        ResponseCookie rc = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .build();
        response.addCookie(rc);
        return Mono.empty();
    }

}
