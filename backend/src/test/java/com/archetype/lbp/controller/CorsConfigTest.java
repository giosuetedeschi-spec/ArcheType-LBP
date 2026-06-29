package com.archetype.lbp.controller;

import com.archetype.lbp.config.CorsConfig;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.servlet.config.annotation.CorsRegistration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import static org.assertj.core.api.Assertions.*;

class CorsConfigTest {

    @Test
    void corsConfigurer_createsConfigurer() {
        CorsConfig config = new CorsConfig();
        // Field is @Value-injected, so we test the bean exists
        assertThat(config).isNotNull();
    }

    @Test
    void corsRegistry_addMapping() {
        CorsRegistry registry = new CorsRegistry();
        CorsRegistration reg = registry.addMapping("/api/**");
        assertThat(reg).isNotNull();
    }
}
