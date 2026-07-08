package com.archetype.lbp.dto;

import lombok.Data;

@Data
public class LeaderboardFilterRequest {
    // Id di chi guarda la classifica: serve per risolvere lo scope "friends"
    // (amici di questo utente) e per calcolare la sua posizione (myEntry)
    // anche se non rientra nella pagina corrente.
    private Long userId;

    // Valori accettati: "global" | "friends".
    // "local" è stato rimandato: manca ancora un campo regione sull'utente.
    private String scope = "global";

    // Valori accettati: "hours" (ore di gioco), "games" (giochi posseduti,
    // wishlist esclusa), "friends" (amici aggiunti).
    private String metric = "hours";

    private int page = 0;
    private int size = 20;
}
