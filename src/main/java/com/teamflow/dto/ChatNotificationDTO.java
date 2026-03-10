package com.teamflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatNotificationDTO {
    private Long roomId;
    private Long projectId;
    private long unreadCount;
}
