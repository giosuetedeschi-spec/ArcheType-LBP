-- Backfill "mature" per i giochi già presenti in database (compreso il
-- dump esterno scaricato da db/initdb.d/02_download_seed.sh, generato in
-- un momento precedente a questo elenco di parole chiave) il cui nome
-- contiene uno dei termini adulti anche aggiunti dopo l'import originale.
-- Stessa lista di NAME_ADULT_KEYWORDS in scripts/populate_db.py, così le
-- due fonti restano coerenti — ma qui si applica direttamente ai dati
-- esistenti, non alla pipeline di importazione (che non viene toccata).
--
-- -- Secondo giro di backfill "mature" (dopo V8), stesso meccanismo: si applica
-- anche al database già popolato dal dump esterno, al prossimo avvio del
-- backend, senza toccare la pipeline di importazione né il docker-compose.
--
-- Parole aggiunte in questo giro (vedi anche NAME_ADULT_KEYWORDS in
-- scripts/populate_db.py, tenuta allineata a questa lista): naughty, booty,
-- dominatrixes, temptations, succubus harem, lust, desire, pussies,
-- lesbian, eros, lonely christmas, femboy, furry, body omg,
-- hot girl, hot summer, hot body, hot sweet, gal geek, sweet geek,
-- waifu, big titties, jigsaw, nude, hearts and love, monster girl.
--
-- Le keyword vengono confrontate con ILIKE, quindi il matching è
-- case-insensitive.

UPDATE games
SET mature = TRUE
WHERE mature = FALSE
  AND (
    name ILIKE '%naughty%'
    OR name ILIKE '%booty%'
    OR name ILIKE '%dominatrixes%'
    OR name ILIKE '%temptations%'
    OR name ILIKE '%succubus harem%'
    OR name ILIKE '%lust%'
    OR name ILIKE '%desire%'
    OR name ILIKE '%pussies%'
    OR name ILIKE '%lesbian%'
    OR name ILIKE '%eros%'
    OR name ILIKE '%lonely christmas%'
    OR name ILIKE '%femboy%'
    OR name ILIKE '%furry%'
    OR name ILIKE '%body omg%'
    OR name ILIKE '%hot girl%'
    OR name ILIKE '%hot summer%'
    OR name ILIKE '%hot body%'
    OR name ILIKE '%hot sweet%'
    OR name ILIKE '%gal geek%'
    OR name ILIKE '%sweet geek%'
    OR name ILIKE '%waifu%'
    OR name ILIKE '%big titties%'
    OR name ILIKE '%jigsaw%'
    OR name ILIKE '%nude%'
    OR name ILIKE '%hearts and love%'
    OR name ILIKE '%monster girl%'
    OR name ILIKE '%milf%'
    OR name ILIKE '%sex%'
    OR name ILIKE '%sexy%'
    OR name ILIKE '%fuck%'
    OR name ILIKE '%fucking%'
    OR name ILIKE '%cutie%'
    OR name ILIKE '%cute%'
    OR name ILIKE '%sweet%'
    OR name ILIKE '%slave%'
    OR name ILIKE '%seducer%'



  );