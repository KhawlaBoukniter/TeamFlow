package com.teamflow.service.interfaces;

import com.teamflow.dto.AuditLogDTO;

import java.util.List;

public interface AuditLogService {
    void logAction(String action, String entity, Long entityId, String details);

    List<AuditLogDTO> getLogsByEntity(String entity, Long entityId);
}
