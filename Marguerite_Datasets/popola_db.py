import json
import mysql.connector

# 1. Connetti al database MySQL (XAMPP)
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",          # su XAMPP di default la password è vuota
    database="steam_games"
)
cursor = conn.cursor()

# 2. Crea la tabella GIOCO
cursor.execute('''
    CREATE TABLE IF NOT EXISTS GIOCO (
        CodG    INT PRIMARY KEY,
        Nome    TEXT,
        DataRilascio TEXT,
        EtaMinima    INT,
        Prezzo       FLOAT,
        Descrizione  TEXT
    )
''')

# 3. Leggi il JSON e popola
print("Caricamento dati in corso...")

with open('games.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

inseriti = 0
saltati  = 0

for gioco in data:
    cod_g = gioco.get('AppID')

    # Salta i record senza AppID (chiave primaria obbligatoria)
    if not cod_g:
        saltati += 1
        continue

    nome        = gioco.get('Name', '')
    data_r      = gioco.get('Release date', '')
    eta_minima  = gioco.get('Required age', 0)
    prezzo      = gioco.get('Price', 0.0)
    descrizione = gioco.get('About the game', '')

    try:
        cursor.execute('''
            INSERT IGNORE INTO GIOCO (CodG, Nome, DataRilascio, EtaMinima, Prezzo, Descrizione)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (cod_g, nome, data_r, eta_minima, prezzo, descrizione))
        inseriti += 1
    except Exception as e:
        print(f"Errore su AppID {cod_g}: {e}")
        saltati += 1

# 4. Salva e chiudi
conn.commit()
conn.close()

print(f"Fatto! Inseriti: {inseriti} | Saltati: {saltati}")