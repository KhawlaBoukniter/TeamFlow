package com.teamflow.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MessageDTO {
    private Long id;
    private String content;
    private Long senderId;
    private String senderName;
    private Long chatRoomId;
    private LocalDateTime createdAt;
}
