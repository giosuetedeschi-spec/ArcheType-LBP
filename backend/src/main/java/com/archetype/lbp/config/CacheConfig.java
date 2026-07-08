package com.archetype.lbp.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Configurazione della cache applicativa, basata su Caffeine.
 *
 * Attualmente usata solo per le statistiche utente (vedi
 * {@link com.archetype.lbp.service.StatsService#getUserStats}), che
 * richiedono di scorrere e aggregare tutta la libreria di un utente ad
 * ogni chiamata — un calcolo che vale la pena cacheare perché i dati
 * sottostanti cambiano solo quando l'utente modifica esplicitamente la
 * propria libreria (vedi {@link com.archetype.lbp.service.UserGameService},
 * che invalida la cache ad ogni mutazione tramite {@code @CacheEvict}).
 *
 * Il TTL impostato qui (expireAfterWrite) è una rete di sicurezza, non il
 * meccanismo primario di invalidazione: l'invalidazione esplicita su
 * scrittura tiene i dati sempre corretti nel percorso normale, ma un TTL
 * breve protegge comunque da fonti di modifica non coperte dall'eviction
 * esplicita (es. una modifica diretta al database, uno script di
 * manutenzione, un futuro endpoint che dimentica l'annotazione).
 */
@Configuration
public class CacheConfig {

    /**
     * Nome della cache per le statistiche utente. Costante condivisa (non
     * una stringa letterale ripetuta) tra questa configurazione e le
     * annotazioni {@code @Cacheable}/{@code @CacheEvict} nei service, per
     * evitare che un refuso in una delle due parti rompa silenziosamente
     * l'invalidazione (cache ed eviction su nomi diversi = dati stantii mai
     * ripuliti).
     */
    public static final String USER_STATS_CACHE = "userStats";

    /**
     * Crea il CacheManager basato su Caffeine con cui Spring realizza
     * {@code @Cacheable}/{@code @CacheEvict}.
     *
     * Impostazioni scelte:
     * - expireAfterWrite 5 minuti: rete di sicurezza (vedi Javadoc di
     *   classe), non il meccanismo primario di invalidazione.
     * - maximumSize 10.000: limite superiore alle voci in cache (una per
     *   utente con statistiche calcolate di recente), per evitare crescita
     *   di memoria non limitata in caso di traffico anomalo.
     * - recordStats: abilita le metriche interne di Caffeine (hit/miss
     *   rate), utili per verificare che la cache stia davvero riducendo il
     *   carico sul database una volta in produzione.
     *
     * @return CacheManager configurato per la cache "userStats".
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(USER_STATS_CACHE);
        manager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(5, TimeUnit.MINUTES)
                .maximumSize(10_000)
                .recordStats());
        return manager;
    }
}
