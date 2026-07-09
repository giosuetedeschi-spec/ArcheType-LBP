package com.archetype.lbp.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LeaderboardFilterRequest {
    // Id di chi guarda la classifica: serve per risolvere lo scope "friends"
    // (amici di questo utente) e per calcolare la sua posizione (myEntry)
    // anche se non rientra nella pagina corrente. Senza questo controllo,
    // un userId mancante arrivava fino a userRepo.findById(null) e usciva
    // come 500 generico invece di un 400 di validazione.
    @NotNull(message = "userId è obbligatorio")
    private Long userId;

    // Valori accettati: "global" | "friends".
    // "local" è stato rimandato: manca ancora un campo regione sull'utente.
    private String scope = "global";

    // Valori accettati: "hours" (ore di gioco), "games" (giochi posseduti,
    // wishlist esclusa), "friends" (amici aggiunti).
    private String metric = "hours";

    @Min(value = 0, message = "page non può essere negativo")
    private int page = 0;

    @Min(value = 1, message = "size deve essere almeno 1")
    @Max(value = 100, message = "size non può superare 100")
    private int size = 20;
}
