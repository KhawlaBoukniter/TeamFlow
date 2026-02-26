package com.teamflow.controller;

import com.teamflow.dto.SubTaskDTO;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import com.teamflow.service.interfaces.SubTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubTaskController {

    private final SubTaskService subTaskService;

    @GetMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<List<SubTaskDTO>> getSubTasksByTaskId(@PathVariable Long taskId) {
        return ResponseEntity.ok(subTaskService.getSubTasksByTaskId(taskId));
    }

    @PostMapping("/tasks/{taskId}/subtasks")
    public ResponseEntity<SubTaskDTO> createSubTask(@PathVariable Long taskId,
            @Validated(Create.class) @RequestBody SubTaskDTO dto) {
        return new ResponseEntity<>(subTaskService.createSubTask(taskId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/subtasks/{id}")
    public ResponseEntity<SubTaskDTO> updateSubTask(@PathVariable Long id,
            @Validated(Update.class) @RequestBody SubTaskDTO dto) {
        return ResponseEntity.ok(subTaskService.updateSubTask(id, dto));
    }

    @DeleteMapping("/subtasks/{id}")
    public ResponseEntity<Void> deleteSubTask(@PathVariable Long id) {
        subTaskService.deleteSubTask(id);
        return ResponseEntity.noContent().build();
    }
}
