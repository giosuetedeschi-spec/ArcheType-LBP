# Progettazione Database - Progetto "Statistiche per gamer"

## 1. Schema Entità-Relazione

Per gestire correttamente il catalogo Steam e le interazioni utente, il database sarà composto dalle seguenti entità principali:

### Tabella: GIOCO
* **CodG (PK)**: Identificativo univoco (corrisponde all'`AppID` del dataset)
* **Nome**: Titolo del gioco
* **DataRilascio**: Data di pubblicazione
* **EtaMinima**: Età minima richiesta
* **Prezzo**: Costo in USD
* **Descrizione**: Breve descrizione testuale (se si riesce)

### Tabella: UTENTE
* **CodU (PK)**: Identificativo univoco utente
* **Nome**: Nome visualizzato
* **Email**: Indirizzo email
* **Password**: Hash della password

### Tabella: LIBRERIA (Relazione Utente-Gioco)
Questa tabella sarà il ponte che gestirà il Backlog e la Wishlist
* **CodU (FK)**: Riferimento all'utente
* **CodG (FK)**: Riferimento al gioco
* **Stato**: `ENUM('Wishlist', 'In corso', 'Finito', 'Abbandonato')`
* *Nota*: La combinazione `(CodU, CodG)` è la nostra **Chiave Primaria (PK) composta**

---

## 2. Note Tecniche per il Popolamento (Python)
Il popolamento avverrà tramite uno script Python che eseguirà le seguenti operazioni:
1.  **Lettura**: Parsing del file `games.json`
2.  **Pulizia**: Rimozione di record duplicati o privi di `CodG`
3.  **Inserimento**: Utilizzo di transazioni SQL per inserire i dati nella tabella `GIOCO` in modalità hardcore (ahaha)

---

## 3. Vincoli di Integrità
* Ogni record in `LIBRERIA` references un `CodU` e `CodG` esistenti (vincoli di chiave esterna)
* Gli attributi multivalore (Tag, Generi) saranno gestiti tramite tabelle di supporto per mantenere la forma normale del database (evitando la duplicazione di dati nella tabella `GIOCO`)