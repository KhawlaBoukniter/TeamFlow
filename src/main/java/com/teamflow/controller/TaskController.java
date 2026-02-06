package com.teamflow.controller;

import com.teamflow.dto.TaskDTO;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import com.teamflow.service.interfaces.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/columns/{columnId}/tasks")
    public ResponseEntity<List<TaskDTO>> getTasksByColumnId(@PathVariable Long columnId) {
        return ResponseEntity.ok(taskService.getTasksByColumnId(columnId));
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @PostMapping("/columns/{columnId}/tasks")
    public ResponseEntity<TaskDTO> createTask(@PathVariable Long columnId,
            @Validated(Create.class) @RequestBody TaskDTO dto) {
        return new ResponseEntity<>(taskService.createTask(columnId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable Long id,
            @Validated(Update.class) @RequestBody TaskDTO dto) {
        return ResponseEntity.ok(taskService.updateTask(id, dto));
    }

    @PutMapping("/tasks/{id}/move")
    public ResponseEntity<TaskDTO> moveTask(@PathVariable Long id, @RequestParam Long targetColumnId) {
        return ResponseEntity.ok(taskService.moveTask(id, targetColumnId));
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tasks/{id}/assignments")
    public ResponseEntity<com.teamflow.dto.TaskAssignmentDTO> assignUser(@PathVariable Long id,
            @RequestBody java.util.Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String role = payload.get("roleInTask").toString();
        return ResponseEntity.ok(taskService.assignUserToTask(id, userId, role));
    }

    @DeleteMapping("/tasks/{id}/assignments/{userId}")
    public ResponseEntity<Void> removeAssignment(@PathVariable Long id, @PathVariable Long userId) {
        taskService.removeAssignment(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/tasks/{id}/dependencies/{dependencyId}")
    public ResponseEntity<Void> addDependency(@PathVariable Long id, @PathVariable Long dependencyId) {
        taskService.addDependency(id, dependencyId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/tasks/{id}/dependencies/{dependencyId}")
    public ResponseEntity<Void> removeDependency(@PathVariable Long id, @PathVariable Long dependencyId) {
        taskService.removeDependency(id, dependencyId);
        return ResponseEntity.noContent().build();
    }
}
