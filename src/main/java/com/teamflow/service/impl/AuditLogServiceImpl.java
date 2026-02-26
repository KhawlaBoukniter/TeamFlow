package com.teamflow.service.impl;

import com.teamflow.dto.AuditLogDTO;
import com.teamflow.entity.AuditLog;
import com.teamflow.entity.User;
import com.teamflow.repository.AuditLogRepository;
import com.teamflow.repository.UserRepository;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public void logAction(String action, String entity, Long entityId, String details) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null)
            return;

        AuditLog log = new AuditLog();
        log.setAction(action);
        log.setEntity(entity);
        log.setEntityId(entityId);
        log.setDetails(details);
        log.setPerformedBy(user);

        auditLogRepository.save(log);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogDTO> getLogsByEntity(String entity, Long entityId) {
        return auditLogRepository.findByEntityAndEntityIdOrderByCreatedAtDesc(entity, entityId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogDTO> getAllLogs() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private AuditLogDTO toDTO(AuditLog log) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.setId(log.getId());
        dto.setAction(log.getAction());
        dto.setEntity(log.getEntity());
        dto.setEntityId(log.getEntityId());
        dto.setDetails(log.getDetails());
        dto.setPerformedByEmail(log.getPerformedBy() != null ? log.getPerformedBy().getEmail() : null);
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
