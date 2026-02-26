package com.teamflow.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class AuditLogDTO {
    private Long id;
    private String action;
    private String entity;
    private Long entityId;
    private String details;
    private String performedByEmail;
    private LocalDateTime createdAt;
}
