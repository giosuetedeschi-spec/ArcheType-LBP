package com.archetype.lbp.service;

import com.archetype.lbp.config.CacheConfig;
import com.archetype.lbp.repository.UserGameRepository;
import com.archetype.lbp.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import java.util.List;

import static org.mockito.Mockito.*;

/**
 * Verifica che getUserStats sia davvero cacheato, cosa che
 * {@link StatsServiceTest} (test unitario con {@code @InjectMocks}) NON può
 * verificare: {@code @InjectMocks} crea l'istanza del service con un
 * semplice {@code new StatsService(...)}, scavalcando del tutto il proxy
 * AOP con cui Spring realizza {@code @Cacheable}/{@code @CacheEvict}. In
 * quel test, ogni chiamata invoca sempre direttamente i mock — l'annotazione
 * @Cacheable è presente sul metodo ma nessun meccanismo la applica
 * davvero, quindi un'asserzione sul numero di chiamate al repository
 * risulterebbe sempre "due chiamate", indipendentemente dal fatto che la
 * cache funzioni o meno: un test del genere darebbe un falso senso di
 * sicurezza.
 *
 * Qui invece carichiamo un vero (seppur minimo) ApplicationContext Spring
 * tramite {@code @SpringBootTest}, limitato alla sola {@link TestConfig}
 * (non l'intera {@code Application}: niente security, niente datasource
 * reale) — così il bean StatsService iniettato è effettivamente quello
 * "proxato" da Spring con il comportamento di cache reale.
 */
@SpringBootTest(
        classes = StatsServiceCacheTest.TestConfig.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE
)
class StatsServiceCacheTest {

    /**
     * Contesto Spring minimo per questo test: abilita il caching e
     * registra solo CacheConfig + StatsService, senza scansionare né
     * caricare il resto dell'applicazione (controller, security, JWT,
     * datasource reale).
     */
    @Configuration
    @EnableCaching
    @Import(CacheConfig.class)
    static class TestConfig {
        @Bean
        StatsService statsService(UserGameRepository userGameRepo, UserRepository userRepo) {
            return new StatsService(userGameRepo, userRepo);
        }
    }

    @MockBean
    private UserGameRepository userGameRepo;

    @MockBean
    private UserRepository userRepo;

    /**
     * Bean gestito dal contesto Spring (non creato con {@code new} come in
     * StatsServiceTest): questo è il proxy con la cache applicata davvero.
     */
    @Autowired
    private StatsService statsService;

    /**
     * CacheManager dello stesso contesto Spring usato da statsService.
     * Necessario per pulire esplicitamente la cache prima di ogni test:
     * Spring riusa lo stesso ApplicationContext (e quindi lo stesso
     * CacheManager, un singleton) tra i metodi di test di questa classe,
     * quindi senza questa pulizia una voce di cache scritta da un test
     * "sopravvive" e altera il risultato di quello successivo, in modo
     * dipendente dall'ordine di esecuzione (non garantito da JUnit) — è
     * esattamente il bug che la prima versione di questo test aveva.
     */
    @Autowired
    private CacheManager cacheManager;

    @BeforeEach
    void clearCache() {
        Cache cache = cacheManager.getCache(CacheConfig.USER_STATS_CACHE);
        if (cache != null) {
            cache.clear();
        }
    }

    /**
     * Due chiamate consecutive con lo stesso userId devono risultare in
     * UNA sola interrogazione reale al repository: la seconda va servita
     * dalla cache Caffeine.
     */
    @Test
    void getUserStats_secondCall_usesCacheInsteadOfRepository() {
        when(userRepo.existsById(1L)).thenReturn(true);
        when(userGameRepo.findByUser_Id(1L)).thenReturn(List.of());

        statsService.getUserStats(1L);
        statsService.getUserStats(1L);

        verify(userGameRepo, times(1)).findByUser_Id(1L);
        verify(userRepo, times(1)).existsById(1L);
    }

    /**
     * Utenti diversi devono avere voci di cache distinte (chiave = userId):
     * la cache non deve mai restituire le statistiche di un utente per un
     * altro, né evitare la query solo perché "qualcosa" è già in cache.
     */
    @Test
    void getUserStats_differentUsers_eachHitsRepositoryOnce() {
        when(userRepo.existsById(1L)).thenReturn(true);
        when(userRepo.existsById(2L)).thenReturn(true);
        when(userGameRepo.findByUser_Id(1L)).thenReturn(List.of());
        when(userGameRepo.findByUser_Id(2L)).thenReturn(List.of());

        statsService.getUserStats(1L);
        statsService.getUserStats(2L);

        verify(userGameRepo, times(1)).findByUser_Id(1L);
        verify(userGameRepo, times(1)).findByUser_Id(2L);
    }
}
