#!/bin/bash
# Scarica il seed del dataset Steam da GitHub Releases e lo carica in Postgres.
# Eseguito automaticamente da docker-entrypoint-initdb.d al primo avvio
# con volume vuoto. Negli avvii successivi Postgres ignora questa cartella.

set -e

SEED_URL="https://github.com/giosuetedeschi-spec/ArcheType-LBP/releases/download/v1.0-seed/seed_games.sql.gz"
SEED_FILE="/tmp/seed_games.sql.gz"
SENTINEL="/var/lib/postgresql/seed_completed"

echo "=== [02] Download seed dataset da GitHub Releases ==="
wget -q -O "$SEED_FILE" "$SEED_URL"

echo "=== [02] Caricamento seed nel database ==="
gunzip -c "$SEED_FILE" | psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

touch "$SENTINEL"
echo "=== [02] Seed completato ==="
