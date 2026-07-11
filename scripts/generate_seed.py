"""Genera il dataset curato a partire dal CSV Steam grezzo.

Legge /data/games.csv riga per riga (modulo csv, tollerante), scarta le
righe malformate (numero campi inatteso, AppID non numerico, Name che è
una data = riga slittata), applica i filtri di curation (no-name,
no-image, adult) e scrive:
  /out/games_clean.csv — dataset pulito, header canonico a 40 colonne
  /out/rejected.csv    — righe scartate con motivo (per audit)
Da eseguire UNA volta: l'output alimenta il repopulate e il pg_dump che
diventa il seed versionato del progetto.
"""
import csv, re, sys

SRC, DST, REJ = "/data/games.csv", "/out/games_clean.csv", "/out/rejected.csv"
ADULT_KW = ("hentai", "sexual content", "nudity", "nsfw", "adults only")
DATE_RE = re.compile(r"^[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}$")  # "Apr 5, 2023"

# Header canonico: nell'header originale "Discount" e "DLC count" risultano
# fusi ("DiscountDLC count"), nei dati sono spesso separati -> 39 vs 40 campi.
NAMES = ["AppID","Name","Release date","Estimated owners","Peak CCU",
    "Required age","Price","Discount","DLC count","About the game",
    "Supported languages","Full audio languages","Reviews","Header image",
    "Website","Support url","Support email","Windows","Mac","Linux",
    "Metacritic score","Metacritic url","User score","Positive","Negative",
    "Score rank","Achievements","Recommendations","Notes",
    "Average playtime forever","Average playtime two weeks",
    "Median playtime forever","Median playtime two weeks","Developers",
    "Publishers","Categories","Genres","Tags","Screenshots","Movies"]

def idx(n_fields: int) -> dict:
    """Mappa campo->indice; per righe a 39 campi gli indici dopo Price slittano di -1."""
    off = 0 if n_fields == 40 else -1
    return {"appid": 0, "name": 1, "age": 5,
            "header": 13 + off, "notes": 28 + off, "tags": 37 + off}

def is_empty(v: str) -> bool:
    """True per vuoti impliciti: '', 'none', 'nan' (stessa semantica di _clean_text)."""
    return v.strip().lower() in ("", "none", "nan")

def is_adult(row, m) -> bool:
    """True se Required age >= 18 o keyword adult in Tags/Notes."""
    try:
        if float(row[m["age"]] or 0) >= 18:
            return True
    except ValueError:
        pass
    blob = (row[m["tags"]] + " " + row[m["notes"]]).lower()
    return any(k in blob for k in ADULT_KW)

def main():
    csv.field_size_limit(sys.maxsize)
    s = {"totale": 0, "malformed": 0, "no_name": 0, "no_image": 0,
         "adult": 0, "tenuti": 0}
    with open(SRC, newline="", encoding="utf-8") as fin, \
         open(DST, "w", newline="", encoding="utf-8") as fout, \
         open(REJ, "w", newline="", encoding="utf-8") as frej:
        rdr = csv.reader(fin); next(rdr)  # salta header originale (malformato)
        w, wr = csv.writer(fout), csv.writer(frej)
        w.writerow(NAMES); wr.writerow(["motivo"] + NAMES)
        for row in rdr:
            s["totale"] += 1
            n = len(row)
            if n not in (39, 40) or not row[0].strip().isdigit() \
               or DATE_RE.match(row[1].strip()):
                s["malformed"] += 1; wr.writerow(["malformed"] + row); continue
            m = idx(n)
            if is_empty(row[m["name"]]):
                s["no_name"] += 1; wr.writerow(["no_name"] + row); continue
            if is_empty(row[m["header"]]):
                s["no_image"] += 1; wr.writerow(["no_image"] + row); continue
            if is_adult(row, m):
                s["adult"] += 1; wr.writerow(["adult"] + row); continue
            if n == 39:  # riallinea a 40 colonne inserendo Discount vuoto
                row = row[:7] + [""] + row[7:]
            w.writerow(row); s["tenuti"] += 1
    for k, v in s.items():
        print(f"{k:>10}: {v}")

if __name__ == "__main__":
    main()