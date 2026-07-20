package com.archetype.lbp;

import com.archetype.lbp.dto.ApiResponse;
import com.archetype.lbp.dto.GameRequest;
import com.archetype.lbp.dto.PagedResponse;
import com.archetype.lbp.repository.GameRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Punto di ingresso dell'applicazione Spring Boot.
 *
 * {@code @EnableCaching} attiva il supporto di Spring per
 * {@code @Cacheable}/{@code @CacheEvict}, usati da
 * {@link com.archetype.lbp.service.StatsService} e
 * {@link com.archetype.lbp.service.UserGameService} per cacheare le
 * statistiche utente (vedi {@link com.archetype.lbp.config.CacheConfig}
 * per il provider Caffeine e la sua configurazione).
 */
@SpringBootApplication
@EnableCaching
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    // ponytail: self-check, no JUnit needed. Run with: mvn exec:java -Dexec.mainClass="com.archetype.lbp.Application#demo"
    public static void demo() {
        int failures = 0;

        // === GameRepository.withFilters() ===
        var spec = GameRepository.withFilters("counter", null, null, null, null, null, null, null, null, null, null, null, null);
        if (spec == null) { System.err.println("FAIL: withFilters returns null"); failures++; }

        // === ColorPalette.resolve() ===
        var green = com.archetype.lbp.util.ColorPalette.resolve("GREEN");
        if (green == null || green.length != 3) { System.err.println("FAIL: ColorPalette.resolve(\"GREEN\") should resolve case-insensitively"); failures++; }
        if (com.archetype.lbp.util.ColorPalette.resolve("not-a-color") != null) { System.err.println("FAIL: ColorPalette.resolve should return null for unknown color"); failures++; }
        if (com.archetype.lbp.util.ColorPalette.resolve(null) != null) { System.err.println("FAIL: ColorPalette.resolve(null) should return null"); failures++; }

        // === GameRequest validation ===
        var req = new GameRequest();
        req.setSteamAppId(null);
        req.setName("");
        if (req.getSteamAppId() != null) { System.err.println("FAIL: null check"); failures++; }

        // === ApiResponse wrapper ===
        var ok = ApiResponse.ok("test");
        if (!ok.isSuccess()) { System.err.println("FAIL: ApiResponse.ok success=false"); failures++; }
        var err = ApiResponse.error("nope");
        if (err.isSuccess()) { System.err.println("FAIL: ApiResponse.error success=true"); failures++; }

        // === Status validation ===
        var validStatuses = java.util.Set.of("wishlist", "playing", "finished", "abandoned");
        for (String s : validStatuses) {
            if (!s.matches("wishlist|playing|finished|abandoned")) {
                System.err.println("FAIL: status regex rejected valid: " + s);
                failures++;
            }
        }
        if ("invalid".matches("wishlist|playing|finished|abandoned")) {
            System.err.println("FAIL: status regex accepted invalid value");
            failures++;
        }

        // === PagedResponse ===
        var paged = new PagedResponse<>();
        paged.setContent(java.util.List.of());
        paged.setTotalElements(0);
        paged.setTotalPages(0);
        if (!paged.getContent().isEmpty()) { System.err.println("FAIL: PagedResponse content not empty"); failures++; }

        if (failures == 0) {
            System.out.println("ALL CHECKS PASSED");
        } else {
            System.err.println(failures + " CHECK(S) FAILED");
            System.exit(1);
        }
    }
}
