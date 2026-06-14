import json

file_name = 'games.json'

try:
    with open(file_name, 'r', encoding='utf-8') as f:
        data = json.load(f)

        # 'data' è una lista, prendiamo il primo elemento
        primo_gioco = data[0]

        print("--- Analisi struttura JSON ---")
        print(f"Totale giochi nel dataset: {len(data)}")
        print(f"\nProprietà del primo gioco (primo elemento della lista):")

        for chiave, valore in primo_gioco.items():
            print(f"- {chiave}: {valore}")

except Exception as e:
    print(f"Errore: {e}")
