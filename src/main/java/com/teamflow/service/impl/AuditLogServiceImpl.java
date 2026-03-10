package com.teamflow.service.impl;

import com.teamflow.dto.AuditLogDTO;
import com.teamflow.entity.AuditLog;
import com.teamflow.entity.User;
import com.teamflow.repository.AuditLogRepository;
import com.teamflow.repository.UserRepository;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void logAction(String action, String entity, Long entityId, String details) {
        Long userId;
        try {
            userId = SecurityUtils.getCurrentUserId();
        } catch (IllegalStateException e) {
            return;
        }
        userRepository.findById(userId).ifPresent(user -> logAction(action, entity, entityId, details, user));
    }

    @Override
    @Transactional
    public void logAction(String action, String entity, Long entityId, Long projectId, String details) {
        Long userId;
        try {
            userId = SecurityUtils.getCurrentUserId();
        } catch (IllegalStateException e) {
            return;
        }
        userRepository.findById(userId)
                .ifPresent(user -> logAction(action, entity, entityId, projectId, details, user));
    }

    @Override
    @Transactional
    public void logAction(String action, String entity, Long entityId, String details, User user) {
        logAction(action, entity, entityId, null, details, user);
    }

    @Override
    @Transactional
    public void logAction(String action, String entity, Long entityId, Long projectId, String details, User user) {
        if (user == null)
            return;

        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setEntity(entity);
        log.setEntityId(entityId);
        log.setProjectId(projectId);
        log.setDetails(details);
        log.setPerformedBy(user);

        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDTO> getLogsByEntity(String entity, Long entityId, Pageable pageable) {
        return auditLogRepository.findByEntityAndEntityIdOrderByCreatedAtDesc(entity, entityId, pageable)
                .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDTO> getLogsByProject(Long projectId, Pageable pageable) {
        return auditLogRepository.findByProjectIdOrderByCreatedAtDesc(projectId, pageable)
                .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDTO> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toDTO);
    }

    private AuditLogDTO toDTO(AuditLog log) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(log.getId());
        dto.setAction(log.getAction());
        dto.setEntityType(log.getEntity());
        dto.setEntityId(log.getEntityId());
        dto.setProjectId(log.getProjectId());
        dto.setDetails(log.getDetails());

        try {
            if (log.getPerformedBy() != null) {
                dto.setUserEmail(log.getPerformedBy().getEmail());
            } else {
                dto.setUserEmail("System");
            }
        } catch (Exception e) {
            System.err.println("[WARN] Could not load performedBy for log " + log.getId() + ": " + e.getMessage());
            dto.setUserEmail("Unknown User");
        }

        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
