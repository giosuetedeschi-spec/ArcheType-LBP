package com.archetype.lbp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequest {
    @NotNull(message = "friendId è obbligatorio")
    private Long friendId;

    private String action; // "accept" or "reject"
}
