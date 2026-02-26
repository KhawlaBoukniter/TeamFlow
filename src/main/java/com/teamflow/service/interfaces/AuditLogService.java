package com.teamflow.service.interfaces;

import com.teamflow.dto.AuditLogDTO;
import com.teamflow.entity.User;

import java.util.List;

public interface AuditLogService {
    void logAction(String action, String entity, Long entityId, String details);

    void logAction(String action, String entity, Long entityId, String details, User user);

    List<AuditLogDTO> getLogsByEntity(String entity, Long entityId);

    List<AuditLogDTO> getAllLogs();
}
