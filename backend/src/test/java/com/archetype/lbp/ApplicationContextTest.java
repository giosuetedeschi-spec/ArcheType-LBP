package com.archetype.lbp;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.flyway.enabled=false",
    "steam.api.key=dummy-key",
    "app.base-url=http://localhost:8080",
    "app.frontend-url=http://localhost:5173",
    // Proprietà aggiunte per soddisfare la configurazione OAuth2:
    "spring.security.oauth2.client.registration.google.client-id=dummy-id",
    "spring.security.oauth2.client.registration.google.client-secret=dummy-secret"
})
class ApplicationContextTest {

    @LocalServerPort
    private int port;

    @Test
    void contextLoads() {
        assertThat(port).isGreaterThan(0);
    }
}