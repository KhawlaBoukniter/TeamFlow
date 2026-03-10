package com.teamflow.controller;

import com.teamflow.dto.AttachmentDTO;
import com.teamflow.service.interfaces.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @PostMapping("/tasks/{taskId}/attachments")
    @PreAuthorize("@projectSecurity.canManageAttachments(#taskId)")
    public ResponseEntity<AttachmentDTO> uploadAttachment(@PathVariable Long taskId,
            @RequestParam("file") MultipartFile file) {
        return new ResponseEntity<>(attachmentService.uploadAttachment(taskId, file), HttpStatus.CREATED);
    }

    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id) {
        Resource file = attachmentService.downloadAttachment(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFilename() + "\"")
                .body(file);
    }

    @GetMapping("/tasks/{taskId}/attachments")
    @PreAuthorize("@projectSecurity.isMemberForTask(#taskId)")
    public ResponseEntity<List<AttachmentDTO>> getAttachmentsByTaskId(@PathVariable Long taskId) {
        return ResponseEntity.ok(attachmentService.getAttachmentsByTaskId(taskId));
    }

    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.noContent().build();
    }
}
