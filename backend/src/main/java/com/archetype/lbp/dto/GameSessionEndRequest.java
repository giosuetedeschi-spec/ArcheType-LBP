package com.archetype.lbp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class GameSessionEndRequest {
    private LocalDateTime sessionEnd;
}
