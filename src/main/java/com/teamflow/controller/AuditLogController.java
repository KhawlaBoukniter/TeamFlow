package com.teamflow.controller;

import com.teamflow.dto.AuditLogDTO;
import com.teamflow.service.interfaces.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AuditLogDTO>> getAllLogs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditLogService.getAllLogs(pageable));
    }
}
