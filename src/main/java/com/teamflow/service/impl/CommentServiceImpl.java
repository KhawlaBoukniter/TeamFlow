package com.teamflow.service.impl;

import com.teamflow.dto.CommentDTO;
import com.teamflow.entity.Comment;
import com.teamflow.entity.Task;
import com.teamflow.entity.User;
import com.teamflow.entity.enums.NotificationType;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.CommentRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.CommentService;
import com.teamflow.service.interfaces.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByTaskId(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        return task.getComments().stream()
                .filter(c -> c.getDeletedAt() == null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CommentDTO createComment(Long taskId, CommentDTO dto) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User currentUser = SecurityUtils.getCurrentUser();

        Comment comment = new Comment();
        comment.setContent(dto.getContent());
        comment.setTask(task);
        comment.setAuthor(currentUser);

        Comment savedComment = commentRepository.save(comment);

        final Long projectId = task.getColumn().getProject().getId();

        // Notify task author (if it's not the commenter)
        try {
            if (task.getCreatedBy() != null && !task.getCreatedBy().getId().equals(currentUser.getId())) {
                notificationService.createNotification(
                    task.getCreatedBy().getId(),
                    currentUser.getFullName() + " a commenté votre tâche : " + task.getTitle(),
                    NotificationType.COMMENT_ADDED,
                    "TASK",
                    task.getId(),
                    projectId
                );
            }
        } catch (Exception e) {
            // Ignore notification errors
        }

        // Notify all assignees
        if (task.getAssignments() != null) {
            final Long currentUserId = currentUser.getId();
            task.getAssignments().forEach(assignment -> {
                try {
                    if (assignment.getUser() != null && !assignment.getUser().getId().equals(currentUserId)) {
                        notificationService.createNotification(
                            assignment.getUser().getId(),
                            currentUser.getFullName() + " a commenté la tâche : " + task.getTitle(),
                            NotificationType.COMMENT_ADDED,
                            "TASK",
                            task.getId(),
                            projectId
                        );
                    }
                } catch (Exception e) {
                    // Ignore notification errors
                }
            });
        }

        return toDTO(savedComment);
    }

    @Override
    @Transactional
    public CommentDTO updateComment(Long id, CommentDTO dto) {
        Comment comment = commentRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));

        comment.setContent(dto.getContent());

        Comment updatedComment = commentRepository.save(comment);
        return toDTO(updatedComment);
    }

    @Override
    @Transactional
    public void deleteComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + id));

        comment.setDeletedAt(LocalDateTime.now());
        commentRepository.save(comment);
    }

    private CommentDTO toDTO(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setTaskId(comment.getTask().getId());
        dto.setUserId(comment.getAuthor().getId());
        dto.setAuthorName(comment.getAuthor().getFullName());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUpdatedAt(comment.getUpdatedAt());
        return dto;
    }
}
