package com.teamflow.service.interfaces;

import com.teamflow.dto.AuditLogDTO;
import com.teamflow.entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditLogService {
    void logAction(String action, String entity, Long entityId, String details);

    void logAction(String action, String entity, Long entityId, Long projectId, String details);

    void logAction(String action, String entity, Long entityId, String details, User user);

    void logAction(String action, String entity, Long entityId, Long projectId, String details, User user);

    Page<AuditLogDTO> getLogsByEntity(String entity, Long entityId, Pageable pageable);

    Page<AuditLogDTO> getLogsByProject(Long projectId, Pageable pageable);

    Page<AuditLogDTO> getAllLogs(Pageable pageable);
}
