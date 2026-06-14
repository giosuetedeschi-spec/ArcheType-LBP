# Documentazione Dataset Steam

Questa cartella contiene il dataset di riferimento per il progetto **Zero Lag S.r.l.**.

## Contenuto
- **File**: 
- **Descrizione**: Dataset completo dei giochi presenti su Steam, utilizzato come base informativa per la piattaforma.
- **Formato**: CSV (Testo UTF-8).

## Note Tecniche
- **Gestione LFS**: Data la dimensione del file (circa 390 MB), è gestito tramite **Git LFS**.
- **Utilizzo**: Questo file deve essere letto dalla procedura di popolamento automatico in Python per alimentare il database relazionale (MySQL).
- **Avviso**: Si sconsiglia l'apertura con Microsoft Excel per evitare la corruzione dei dati o la formattazione errata dei campi.
