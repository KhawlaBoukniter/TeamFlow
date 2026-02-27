package com.teamflow.dto;

import com.teamflow.entity.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private NotificationType type;
    private String message;
    private boolean isRead;
    private LocalDateTime readAt;
    private String entityType;
    private Long entityId;
    private Long projectId;
    private LocalDateTime createdAt;
}
