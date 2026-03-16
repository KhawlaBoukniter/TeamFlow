package com.teamflow.controller;

import com.teamflow.dto.AuditLogDTO;
import com.teamflow.dto.ProjectDTO;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import com.teamflow.service.interfaces.ProjectService;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.CsvExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final AuditLogService auditLogService;
    private final CsvExportService csvExportService;

    @GetMapping
    public ResponseEntity<List<ProjectDTO>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportProjects() {
        List<ProjectDTO> projects = projectService.getAllProjects();
        byte[] csvData = csvExportService.exportProjectsToCsv(projects);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=projects.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @GetMapping("/{id}")
    @PreAuthorize("@projectSecurity.isMember(#id)")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectDTO> createProject(@Validated(Create.class) @RequestBody ProjectDTO dto) {
        return new ResponseEntity<>(projectService.createProject(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@projectSecurity.isManager(#id)")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable Long id,
            @Validated(Update.class) @RequestBody ProjectDTO dto) {
        return ResponseEntity.ok(projectService.updateProject(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@projectSecurity.isManager(#id)")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/audit-logs")
    @PreAuthorize("@projectSecurity.isManager(#id)")
    public ResponseEntity<Page<AuditLogDTO>> getProjectAuditLogs(
            @PathVariable("id") Long id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(auditLogService.getLogsByProject(id, pageable));
    }
}
