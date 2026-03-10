package com.teamflow.controller;

import com.teamflow.dto.CommentDTO;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import com.teamflow.service.interfaces.CommentService;
import org.springframework.security.access.prepost.PreAuthorize;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/tasks/{taskId}/comments")
    @PreAuthorize("@projectSecurity.isMemberForTask(#taskId)")
    public ResponseEntity<List<CommentDTO>> getCommentsByTaskId(@PathVariable Long taskId) {
        return ResponseEntity.ok(commentService.getCommentsByTaskId(taskId));
    }

    @PostMapping("/tasks/{taskId}/comments")
    @PreAuthorize("@projectSecurity.isMemberForTask(#taskId)")
    public ResponseEntity<CommentDTO> createComment(@PathVariable Long taskId,
            @Validated(Create.class) @RequestBody CommentDTO dto) {
        return new ResponseEntity<>(commentService.createComment(taskId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/comments/{id}")
    public ResponseEntity<CommentDTO> updateComment(@PathVariable Long id,
            @Validated(Update.class) @RequestBody CommentDTO dto) {
        return ResponseEntity.ok(commentService.updateComment(id, dto));
    }

    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}
