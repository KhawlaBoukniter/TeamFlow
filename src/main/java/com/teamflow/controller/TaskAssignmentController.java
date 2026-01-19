package com.teamflow.controller;

import com.teamflow.dto.TaskAssignmentDTO;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import com.teamflow.service.interfaces.TaskAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class TaskAssignmentController {

    private final TaskAssignmentService taskAssignmentService;

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<TaskAssignmentDTO>> getAssignmentsByTaskId(@PathVariable Long taskId) {
        return ResponseEntity.ok(taskAssignmentService.getAssignmentsByTaskId(taskId));
    }

    @PostMapping
    public ResponseEntity<TaskAssignmentDTO> assignUserToTask(
            @Validated(Create.class) @RequestBody TaskAssignmentDTO dto) {
        return new ResponseEntity<>(taskAssignmentService.assignUserToTask(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskAssignmentDTO> updateAssignmentRole(@PathVariable Long id,
            @Validated(Update.class) @RequestBody TaskAssignmentDTO dto) {
        return ResponseEntity.ok(taskAssignmentService.updateAssignmentRole(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeAssignment(@PathVariable Long id) {
        taskAssignmentService.removeAssignment(id);
        return ResponseEntity.noContent().build();
    }
}
