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
@Table(name = "game_categories")
@IdClass(GameCategory.PK.class)
public class GameCategory {
    @Id
    @Column(name = "game_id")
    private Long gameId;

    @Id
    @Column(name = "category_id")
    private Long categoryId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PK implements Serializable {
        private Long gameId;
        private Long categoryId;
    }
}
