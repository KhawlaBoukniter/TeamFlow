package com.teamflow.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ChatRoomDTO {
    private Long id;
    private String name;
    private Long projectId;
    private LocalDateTime createdAt;
}
