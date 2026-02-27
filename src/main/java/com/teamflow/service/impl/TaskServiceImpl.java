package com.teamflow.service.impl;

import com.teamflow.dto.TaskDTO;
import com.teamflow.entity.ProjectColumn;
import com.teamflow.entity.Task;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ColumnRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.TaskService;
import com.teamflow.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ColumnRepository columnRepository;
    private final com.teamflow.repository.UserRepository userRepository;
    private final com.teamflow.repository.TaskAssignmentRepository taskAssignmentRepository;
    private final com.teamflow.repository.TaskDependencyRepository taskDependencyRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("@projectSecurity.isMemberForColumn(#columnId)")
    public List<TaskDTO> getTasksByColumnId(Long columnId) {
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
    @PreAuthorize("@projectSecurity.isManagerForTask(#id)")
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
            throw new com.teamflow.exception.AccessDeniedException(
                    "Cannot move a blocked task. Resolve its dependencies first.");
        }

        ProjectColumn targetColumn = columnRepository.findById(targetColumnId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found with id: " + targetColumnId));

        task.setColumn(targetColumn);
        Task updatedTask = taskRepository.save(task);

        List<com.teamflow.entity.TaskDependency> dependents = taskDependencyRepository.findByPrerequisiteId(id);
        for (com.teamflow.entity.TaskDependency dep : dependents) {
            updateBlockedStatus(dep.getDependent().getId());
        }

        auditLogService.logAction("MOVE", "Task", updatedTask.getId(),
                "Moved task to column: " + targetColumn.getName());
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
    public com.teamflow.dto.TaskAssignmentDTO assignUserToTask(Long taskId, Long userId, String role) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        com.teamflow.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (taskAssignmentRepository.findByTask_IdAndUser_Id(taskId, userId).isPresent()) {
            throw new IllegalArgumentException("User is already assigned to this task");
        }

        com.teamflow.entity.TaskAssignment assignment = new com.teamflow.entity.TaskAssignment();
        assignment.setTask(task);
        assignment.setUser(user);
        assignment.setRoleInTask(com.teamflow.entity.enums.RoleInTask.valueOf(role));

        com.teamflow.entity.TaskAssignment savedAssignment = taskAssignmentRepository.save(assignment);

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
    @PreAuthorize("@projectSecurity.isManagerForTask(#taskId)")
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

        com.teamflow.entity.TaskDependency taskDependency = new com.teamflow.entity.TaskDependency();
        taskDependency.setDependent(task);
        taskDependency.setPrerequisite(dependency);
        taskDependency.setType(com.teamflow.entity.enums.DependencyType.BLOCKING);

        taskDependencyRepository.save(taskDependency);
        taskDependencyRepository.flush();

        updateBlockedStatus(taskId);
        auditLogService.logAction("ADD_DEPENDENCY", "Task", taskId, "Added dependency on task ID " + dependencyId);
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isManagerForTask(#taskId)")
    public void removeDependency(Long taskId, Long dependencyId) {
        com.teamflow.entity.TaskDependency dependency = taskDependencyRepository
                .findByDependentIdAndPrerequisiteId(taskId, dependencyId)
                .orElseThrow(() -> new ResourceNotFoundException("Dependency not found"));

        taskDependencyRepository.delete(dependency);
        taskDependencyRepository.flush();
        updateBlockedStatus(taskId);
        auditLogService.logAction("REMOVE_DEPENDENCY", "Task", taskId, "Removed dependency on task ID " + dependencyId);
    }

    private boolean createsCycle(Long taskId, Long newDependencyId) {
        // DFS to check if taskId is reachable from newDependencyId
        java.util.Set<Long> visited = new java.util.HashSet<>();
        java.util.Stack<Long> stack = new java.util.Stack<>();
        stack.push(newDependencyId);

        while (!stack.isEmpty()) {
            Long currentId = stack.pop();
            if (currentId.equals(taskId)) {
                return true;
            }

            if (!visited.contains(currentId)) {
                visited.add(currentId);
                List<com.teamflow.entity.TaskDependency> dependencies = taskDependencyRepository
                        .findByDependentId(currentId);
                for (com.teamflow.entity.TaskDependency dep : dependencies) {
                    stack.push(dep.getPrerequisite().getId());
                }
            }
        }
        return false;
    }

    private void updateBlockedStatus(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        List<com.teamflow.entity.TaskDependency> dependencies = taskDependencyRepository.findByDependentId(taskId);

        boolean shouldBeBlocked = dependencies.stream()
                .anyMatch(dep -> !dep.getPrerequisite().getColumn().isFinal());

        if (task.isBlocked() != shouldBeBlocked) {
            task.setBlocked(shouldBeBlocked);
            taskRepository.save(task);

            // Recursively update tasks that depend on this one
            List<com.teamflow.entity.TaskDependency> dependents = taskDependencyRepository.findByPrerequisiteId(taskId);
            for (com.teamflow.entity.TaskDependency dep : dependents) {
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
        List<com.teamflow.entity.TaskDependency> blocking = taskDependencyRepository.findByDependentId(task.getId());
        dto.setBlockingTasks(blocking.stream()
                .map(dep -> toSummaryDTO(dep.getPrerequisite()))
                .collect(Collectors.toList()));

        List<com.teamflow.entity.TaskDependency> blocked = taskDependencyRepository.findByPrerequisiteId(task.getId());
        dto.setBlockedTasks(blocked.stream()
                .map(dep -> toSummaryDTO(dep.getDependent()))
                .collect(Collectors.toList()));

        return dto;
    }

    private com.teamflow.dto.TaskSummaryDTO toSummaryDTO(Task task) {
        com.teamflow.dto.TaskSummaryDTO dto = new com.teamflow.dto.TaskSummaryDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setPriority(task.getPriority());
        dto.setBlocked(task.isBlocked());
        if (task.getColumn() != null) {
            dto.setColumnId(task.getColumn().getId());
        }
        return dto;
    }

    private com.teamflow.dto.TaskAssignmentDTO toAssignmentDTO(com.teamflow.entity.TaskAssignment assignment) {
        com.teamflow.dto.TaskAssignmentDTO dto = new com.teamflow.dto.TaskAssignmentDTO();
        dto.setId(assignment.getId());
        dto.setTaskId(assignment.getTask().getId());
        dto.setUserId(assignment.getUser().getId());
        dto.setUserName(assignment.getUser().getFullName());
        dto.setUserEmail(assignment.getUser().getEmail());
        dto.setRoleInTask(assignment.getRoleInTask());
        dto.setAssignedAt(assignment.getAssignedAt());
        return dto;
    }
}
