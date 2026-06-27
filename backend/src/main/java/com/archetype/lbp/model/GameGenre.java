package com.archetype.lbp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "game_genres")
@IdClass(GameGenre.PK.class)
public class GameGenre {
    @Id
    @Column(name = "game_id")
    private Long gameId;

    @Id
    @Column(name = "genre_id")
    private Long genreId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PK implements Serializable {
        private Long gameId;
        private Long genreId;
    }
}
