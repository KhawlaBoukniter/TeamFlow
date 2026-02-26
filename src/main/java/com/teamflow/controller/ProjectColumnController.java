package com.teamflow.controller;

import com.teamflow.dto.ProjectColumnDTO;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import com.teamflow.service.interfaces.ProjectColumnService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectColumnController {

    private final ProjectColumnService columnService;

    @GetMapping("/projects/{projectId}/columns")
    public ResponseEntity<List<ProjectColumnDTO>> getColumnsByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(columnService.getColumnsByProjectId(projectId));
    }

    @GetMapping("/columns/{id}")
    public ResponseEntity<ProjectColumnDTO> getColumnById(@PathVariable Long id) {
        return ResponseEntity.ok(columnService.getColumnById(id));
    }

    @PostMapping("/projects/{projectId}/columns")
    public ResponseEntity<ProjectColumnDTO> createColumn(@PathVariable Long projectId,
            @Validated(Create.class) @RequestBody ProjectColumnDTO dto) {
        return new ResponseEntity<>(columnService.createColumn(projectId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/columns/{id}")
    public ResponseEntity<ProjectColumnDTO> updateColumn(@PathVariable Long id,
            @Validated(Update.class) @RequestBody ProjectColumnDTO dto) {
        return ResponseEntity.ok(columnService.updateColumn(id, dto));
    }

    @DeleteMapping("/columns/{id}")
    public ResponseEntity<Void> deleteColumn(@PathVariable Long id) {
        columnService.deleteColumn(id);
        return ResponseEntity.noContent().build();
    }
}
