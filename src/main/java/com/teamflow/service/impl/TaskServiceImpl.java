package com.teamflow.service.impl;

import com.teamflow.dto.AttachmentDTO;
import com.teamflow.dto.TaskAssignmentDTO;
import com.teamflow.dto.TaskDTO;
import com.teamflow.dto.TaskSummaryDTO;
import com.teamflow.entity.Attachment;
import com.teamflow.entity.ProjectColumn;
import com.teamflow.entity.Task;
import com.teamflow.entity.TaskAssignment;
import com.teamflow.entity.TaskDependency;
import com.teamflow.entity.User;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.AttachmentRepository;
import com.teamflow.repository.ColumnRepository;
import com.teamflow.repository.TaskAssignmentRepository;
import com.teamflow.repository.TaskDependencyRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.UserRepository;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.TaskService;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.NotificationService;
import com.teamflow.entity.enums.DependencyType;
import com.teamflow.entity.enums.NotificationType;
import com.teamflow.entity.enums.RoleInTask;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Stack;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ColumnRepository columnRepository;
    private final UserRepository userRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final TaskDependencyRepository taskDependencyRepository;
    private final AttachmentRepository attachmentRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("@projectSecurity.isMemberForColumn(#columnId)")
    public List<TaskDTO> getTasksByColumnId(Long columnId) {
        if (columnId == null) {
            throw new IllegalArgumentException("Column ID cannot be null");
        }
        if (!columnRepository.existsById(columnId)) {
            throw new ResourceNotFoundException("Column not found with id: " + columnId);
        }

        return taskRepository.findByColumn_Id(columnId).stream()
                .filter(t -> t.getDeletedAt() == null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("@projectSecurity.isMemberForTask(#id)")
    public TaskDTO getTaskById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Task ID cannot be null");
        }
        Task task = taskRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return toDTO(task);
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isManagerForColumn(#columnId)")
    public TaskDTO createTask(Long columnId, TaskDTO dto) {
        ProjectColumn column = columnRepository.findById(columnId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found with id: " + columnId));

        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setPriority(dto.getPriority());
        task.setDueDate(dto.getDueDate());
        task.setBlocked(dto.isBlocked());
        task.setColumn(column);

        Task savedTask = taskRepository.save(task);
        auditLogService.logAction("CREATE", "Task", savedTask.getId(), "Created task: " + dto.getTitle());
        return toDTO(savedTask);
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isMemberForTask(#id)")
    public TaskDTO updateTask(Long id, TaskDTO dto) {
        Task task = taskRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setPriority(dto.getPriority());
        task.setDueDate(dto.getDueDate());
        task.setBlocked(dto.isBlocked());

        Task updatedTask = taskRepository.save(task);
        auditLogService.logAction("UPDATE", "Task", updatedTask.getId(), "Updated task details");
        return toDTO(updatedTask);
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.canMoveTask(#id) and @projectSecurity.isMemberForColumn(#targetColumnId)")
    public TaskDTO moveTask(Long id, Long targetColumnId) {
        Task task = taskRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (task.isBlocked()) {
            throw new IllegalStateException(
                    "Cannot move a blocked task. Resolve its dependencies first.");
        }

        ProjectColumn targetColumn = columnRepository.findById(targetColumnId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found with id: " + targetColumnId));

        task.setColumn(targetColumn);
        Task updatedTask = taskRepository.save(task);

        List<TaskDependency> dependents = taskDependencyRepository.findByPrerequisiteId(id);
        for (TaskDependency dep : dependents) {
            updateBlockedStatus(dep.getDependent().getId());
        }

        auditLogService.logAction("MOVE", "Task", updatedTask.getId(),
                "Moved task to column: " + targetColumn.getName());

        // Notify assignees of task movement
        try {
            if (updatedTask.getAssignments() != null && !updatedTask.getAssignments().isEmpty()) {
                final User currentUser = SecurityUtils.getCurrentUser();
                updatedTask.getAssignments().forEach(assignment -> {
                    if (assignment.getUser() != null && !assignment.getUser().getId().equals(currentUser.getId())) {
                        notificationService.createNotification(
                                assignment.getUser().getId(),
                                "La tâche '" + updatedTask.getTitle() + "' a été déplacée vers '"
                                        + targetColumn.getName() + "'",
                                NotificationType.TASK_MOVED,
                                "TASK",
                                updatedTask.getId(),
                                targetColumn.getProject().getId());
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("Failed to send movement notification: " + e.getMessage());
        }

        return toDTO(updatedTask);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskDTO> getMyActiveTasks() {
        Long userId = SecurityUtils.getCurrentUserId();
        return taskRepository.findActiveTasksByUserId(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isManagerForTask(#id)")
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setDeletedAt(LocalDateTime.now());
        taskRepository.save(task);
        auditLogService.logAction("DELETE", "Task", task.getId(), "Task deleted");
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isManagerForTask(#taskId)")
    public TaskAssignmentDTO assignUserToTask(Long taskId, Long userId, String role) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (taskAssignmentRepository.findByTask_IdAndUser_Id(taskId, userId).isPresent()) {
            throw new IllegalArgumentException("User is already assigned to this task");
        }

        TaskAssignment assignment = new TaskAssignment();
        assignment.setTask(task);
        assignment.setUser(user);
        assignment.setRoleInTask(RoleInTask.valueOf(role));

        TaskAssignment savedAssignment = taskAssignmentRepository.save(assignment);

        // Notify user of assignment
        try {
            notificationService.createNotification(
                    userId,
                    "Vous avez été assigné à la tâche : " + task.getTitle(),
                    NotificationType.TASK_ASSIGNED,
                    "TASK",
                    task.getId(),
                    task.getColumn().getProject().getId());
        } catch (Exception e) {

        }

        auditLogService.logAction("ASSIGN", "Task", task.getId(),
                "Assigned user " + user.getFullName() + " as " + role);

        return toAssignmentDTO(savedAssignment);
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isManagerForTask(#taskId)")
    public void removeAssignment(Long taskId, Long userId) {
        com.teamflow.entity.TaskAssignment assignment = taskAssignmentRepository.findByTask_IdAndUser_Id(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Assignment not found for task " + taskId + " and user " + userId));

        taskAssignmentRepository.delete(assignment);
        auditLogService.logAction("UNASSIGN", "Task", taskId, "Removed assignment for user ID " + userId);
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isMemberForTask(#taskId)")
    public void addDependency(Long taskId, Long dependencyId) {
        if (taskId.equals(dependencyId)) {
            throw new IllegalArgumentException("A task cannot depend on itself");
        }

        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        Task dependency = taskRepository.findById(dependencyId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Dependency task not found with id: " + dependencyId));

        if (taskDependencyRepository.existsByDependentIdAndPrerequisiteId(taskId, dependencyId)) {
            throw new IllegalArgumentException("Dependency already exists");
        }

        if (createsCycle(taskId, dependencyId)) {
            throw new IllegalArgumentException("Circular dependency detected");
        }

        TaskDependency taskDependency = new TaskDependency();
        taskDependency.setDependent(task);
        taskDependency.setPrerequisite(dependency);
        taskDependency.setType(DependencyType.BLOCKING);

        taskDependencyRepository.save(taskDependency);

        updateBlockedStatus(taskId);

        // Notify assignees of new dependency
        if (task.getAssignments() != null) {
            final Long projectId = task.getColumn().getProject().getId();
            final User currentUser = SecurityUtils.getCurrentUser();
            task.getAssignments().forEach(assignment -> {
                try {
                    if (assignment.getUser() != null && !assignment.getUser().getId().equals(currentUser.getId())) {
                        notificationService.createNotification(
                                assignment.getUser().getId(),
                                currentUser.getFullName() + " a ajouté une dépendance à la tâche : " + task.getTitle(),
                                NotificationType.TASK_BLOCKED,
                                "TASK",
                                task.getId(),
                                projectId);
                    }
                } catch (Exception e) {

                }
            });
        }

        auditLogService.logAction("ADD_DEPENDENCY", "Task", taskId, "Added dependency on task ID " + dependencyId);
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isMemberForTask(#taskId)")
    public void removeDependency(Long taskId, Long dependencyId) {
        TaskDependency dependency = taskDependencyRepository
                .findByDependentIdAndPrerequisiteId(taskId, dependencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Dependency not found"));

        taskDependencyRepository.delete(dependency);
        updateBlockedStatus(taskId);
        auditLogService.logAction("REMOVE_DEPENDENCY", "Task", taskId, "Removed dependency on task ID " + dependencyId);
    }

    private boolean createsCycle(Long taskId, Long newDependencyId) {
        // DFS to check if taskId is reachable from newDependencyId
        Set<Long> visited = new HashSet<>();
        Stack<Long> stack = new Stack<>();
        stack.push(newDependencyId);

        while (!stack.isEmpty()) {
            Long currentId = stack.pop();
            if (currentId.equals(taskId)) {
                return true;
            }

            if (!visited.contains(currentId)) {
                visited.add(currentId);
                List<TaskDependency> dependencies = taskDependencyRepository
                        .findByDependentId(currentId);
                for (TaskDependency dep : dependencies) {
                    stack.push(dep.getPrerequisite().getId());
                }
            }
        }
        return false;
    }

    private void updateBlockedStatus(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        List<TaskDependency> dependencies = taskDependencyRepository.findByDependentId(taskId);

        boolean shouldBeBlocked = dependencies.stream()
                .anyMatch(dep -> !dep.getPrerequisite().getColumn().isFinal());

        if (task.isBlocked() != shouldBeBlocked) {
            task.setBlocked(shouldBeBlocked);
            taskRepository.save(task);

            // Notify assignees about blocking status change
            try {
                if (task.getAssignments() != null && !task.getAssignments().isEmpty()) {
                    String message = shouldBeBlocked ? "Task is now BLOCKED: " + task.getTitle()
                            : "Task is now UNBLOCKED: " + task.getTitle();
                    NotificationType type = shouldBeBlocked ? NotificationType.TASK_BLOCKED
                            : NotificationType.TASK_UNBLOCKED;

                    final Long projectId = task.getColumn().getProject().getId();
                    task.getAssignments().forEach(assignment -> {
                        if (assignment.getUser() != null) {
                            notificationService.createNotification(
                                    assignment.getUser().getId(),
                                    message,
                                    type,
                                    "TASK",
                                    task.getId(),
                                    projectId);
                        }
                    });
                }
            } catch (Exception e) {
                System.err.println("Failed to send blocking status notification: " + e.getMessage());
            }

            // Recursively update tasks that depend on this one
            List<TaskDependency> dependents = taskDependencyRepository.findByPrerequisiteId(taskId);
            for (TaskDependency dep : dependents) {
                updateBlockedStatus(dep.getDependent().getId());
            }
        }
    }

    private TaskDTO toDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setPriority(task.getPriority());
        dto.setDueDate(task.getDueDate());
        dto.setBlocked(task.isBlocked());
        if (task.getColumn() != null) {
            dto.setColumnId(task.getColumn().getId());
            if (task.getColumn().getProject() != null) {
                dto.setProjectName(task.getColumn().getProject().getName());
                dto.setProjectId(task.getColumn().getProject().getId());
            }
        }
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        if (task.getAssignments() != null) {
            dto.setAssignments(task.getAssignments().stream()
                    .map(this::toAssignmentDTO)
                    .collect(Collectors.toList()));
        }

        // Map Dependencies
        List<TaskDependency> blocking = taskDependencyRepository.findByDependentId(task.getId());
        dto.setBlockingTasks(blocking.stream()
                .map(dep -> toSummaryDTO(dep.getPrerequisite()))
                .collect(Collectors.toList()));

        List<TaskDependency> blocked = taskDependencyRepository.findByPrerequisiteId(task.getId());
        dto.setBlockedTasks(blocked.stream()
                .map(dep -> toSummaryDTO(dep.getDependent()))
                .collect(Collectors.toList()));

        dto.setAttachments(attachmentRepository.findByTaskIdAndDeletedAtIsNull(task.getId()).stream()
                .map(this::toAttachmentDTO)
                .collect(Collectors.toList()));

        return dto;
    }

    private TaskSummaryDTO toSummaryDTO(Task task) {
        TaskSummaryDTO dto = new TaskSummaryDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setPriority(task.getPriority());
        dto.setBlocked(task.isBlocked());
        if (task.getColumn() != null) {
            dto.setColumnId(task.getColumn().getId());
        }
        return dto;
    }

    private TaskAssignmentDTO toAssignmentDTO(TaskAssignment assignment) {
        TaskAssignmentDTO dto = new TaskAssignmentDTO();
        dto.setId(assignment.getId());
        dto.setTaskId(assignment.getTask().getId());
        dto.setUserId(assignment.getUser().getId());
        dto.setUserName(assignment.getUser().getFullName());
        dto.setUserEmail(assignment.getUser().getEmail());
        dto.setRoleInTask(assignment.getRoleInTask());
        dto.setAssignedAt(assignment.getAssignedAt());
        return dto;
    }

    private AttachmentDTO toAttachmentDTO(Attachment attachment) {
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
