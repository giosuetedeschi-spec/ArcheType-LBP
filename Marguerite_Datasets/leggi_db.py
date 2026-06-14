import sqlite3

# 1. Connetti al database esistente
conn = sqlite3.connect('steam_games.db')
cursor = conn.cursor()

# 2. Esegui la query per estrarre tutti i nomi dei giochi
cursor.execute("SELECT nome, data_rilascio FROM GIOCHI")

# 3. Recupera i risultati
risultati = cursor.fetchall()

print("--- Risultati dal Database ---")
for riga in risultati:
    print(f"Gioco: {riga[0]} | Rilasciato il: {riga[1]}")

# 4. Chiudi
conn.close()