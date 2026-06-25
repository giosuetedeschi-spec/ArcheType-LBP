package com.archetype.lbp.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendResponse {
    private Long friendId;
    private String username;
    private String avatarUrl;
    private String status;
    private LocalDateTime createdAt;
}
