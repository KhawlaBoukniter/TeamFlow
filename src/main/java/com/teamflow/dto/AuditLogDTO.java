package com.teamflow.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AuditLogDTO {
    private Long id;
    private String action;
    private String entityType;
    private Long entityId;
    private Long projectId;
    private String details;
    private String userEmail;
    private LocalDateTime createdAt;
}
