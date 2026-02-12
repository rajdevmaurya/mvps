package com.cbs.apigateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.client.web.server.WebSessionServerOAuth2AuthorizedClientRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;

@SpringBootTest(properties = "spring.config.name=test")
class ApiGatewayApplicationTests {

    @Test
    void contextLoads() {
    }

    @TestConfiguration
    static class OAuth2TestConfig {

        @Bean
        ServerOAuth2AuthorizedClientRepository serverOAuth2AuthorizedClientRepository() {
            return new WebSessionServerOAuth2AuthorizedClientRepository();
        }

        @Bean
        ReactiveClientRegistrationRepository reactiveClientRegistrationRepository() {
            ClientRegistration registration = ClientRegistration.withRegistrationId("test")
                    .clientId("test-client")
                    .clientSecret("secret")
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri("http://localhost/redirect")
                    .tokenUri("http://localhost/token")
                    .authorizationUri("http://localhost/auth")
                    .scope("openid")
                    .build();
            return new InMemoryReactiveClientRegistrationRepository(registration);
        }
    }

}
