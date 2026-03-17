package com.teamflow.service.impl;

import com.teamflow.dto.AttachmentDTO;
import com.teamflow.entity.Attachment;
import com.teamflow.entity.Task;
import com.teamflow.entity.User;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.AttachmentRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.security.SecurityUtils;
import com.teamflow.entity.Message;
import com.teamflow.repository.MessageRepository;
import com.teamflow.service.interfaces.AttachmentService;
import com.teamflow.service.interfaces.NotificationService;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.entity.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final MessageRepository messageRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final Path root = Paths.get("uploads");

    @Override
    @Transactional
    @SuppressWarnings("null")
    public AttachmentDTO uploadChatMessageAttachment(Long messageId, MultipartFile file) {
        try {
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }

            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

            User currentUser = SecurityUtils.getCurrentUser();

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String storedFileName = UUID.randomUUID().toString() + fileExtension;
            Files.copy(file.getInputStream(), this.root.resolve(storedFileName), StandardCopyOption.REPLACE_EXISTING);

            Attachment attachment = new Attachment();
            attachment.setFileName(originalFileName);
            attachment.setFileUrl(storedFileName);
            attachment.setFileType(file.getContentType());
            attachment.setFileSize(file.getSize());
            attachment.setMessage(message);
            attachment.setUploadedBy(currentUser);

            Attachment saved = attachmentRepository.save(attachment);
            AttachmentDTO savedDTO = toDTO(saved);

            Long roomId = message.getChatRoom().getId();
            messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/attachments", savedDTO);

            Long projectId = message.getChatRoom().getProject().getId();
            auditLogService.logAction("UPLOAD_CHAT_ATTACHMENT", "Attachment", saved.getId(), projectId,
                    "Uploaded chat file: " + originalFileName);

            return savedDTO;

        } catch (IOException e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    @SuppressWarnings("null")
    public AttachmentDTO uploadAttachment(Long taskId, MultipartFile file) {
        try {
            if (!Files.exists(root)) {
                Files.createDirectories(root);
            }

            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

            User currentUser = SecurityUtils.getCurrentUser();

            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }

            String storedFileName = UUID.randomUUID().toString() + fileExtension;
            Files.copy(file.getInputStream(), this.root.resolve(storedFileName), StandardCopyOption.REPLACE_EXISTING);

            Attachment attachment = new Attachment();
            attachment.setFileName(originalFileName);
            attachment.setFileUrl(storedFileName);
            attachment.setFileType(file.getContentType());
            attachment.setFileSize(file.getSize());
            attachment.setTask(task);
            attachment.setUploadedBy(currentUser);

            Attachment saved = attachmentRepository.save(attachment);

            final Long projectId = task.getColumn().getProject().getId();

            // Notify task author (if not uploader)
            try {
                if (task.getCreatedBy() != null && !task.getCreatedBy().getId().equals(currentUser.getId())) {
                    notificationService.createNotification(
                            task.getCreatedBy().getId(),
                            currentUser.getFullName() + " a ajouté une pièce jointe à votre tâche : " + task.getTitle(),
                            NotificationType.ATTACHMENT_ADDED,
                            "TASK",
                            task.getId(),
                            projectId);
                }
            } catch (Exception e) {

            }

            // Notify task assignees about the new attachment
            if (task.getAssignments() != null) {
                task.getAssignments().forEach(assignment -> {
                    try {
                        // Don't notify the uploader
                        if (!assignment.getUser().getId().equals(currentUser.getId())) {
                            notificationService.createNotification(
                                    assignment.getUser().getId(),
                                    currentUser.getFullName() + " a ajouté une pièce jointe à la tâche : "
                                            + task.getTitle(),
                                    NotificationType.ATTACHMENT_ADDED,
                                    "TASK",
                                    task.getId(),
                                    projectId);
                        }
                    } catch (Exception e) {

                    }
                });
            }

            auditLogService.logAction("UPLOAD_ATTACHMENT", "Attachment", saved.getId(), projectId,
                    "Uploaded file: " + originalFileName);

            return toDTO(saved);

        } catch (IOException e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("null")
    public Resource downloadAttachment(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        try {
            Path file = root.resolve(attachment.getFileUrl());
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read the file!");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    @SuppressWarnings("null")
    public void deleteAttachment(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));

        attachment.setDeletedAt(java.time.LocalDateTime.now());
        attachmentRepository.save(attachment);

        Long projectId = attachment.getTask().getColumn().getProject().getId();
        auditLogService.logAction("DELETE_ATTACHMENT", "Attachment", attachmentId, projectId,
                "Deleted attachment: " + attachment.getFileName());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttachmentDTO> getAttachmentsByTaskId(Long taskId) {
        return attachmentRepository.findByTaskIdAndDeletedAtIsNull(taskId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private AttachmentDTO toDTO(Attachment attachment) {
        return AttachmentDTO.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .fileUrl(attachment.getFileUrl())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .uploadedByUserName(
                        attachment.getUploadedBy() != null ? attachment.getUploadedBy().getFullName() : "Unknown")
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}
