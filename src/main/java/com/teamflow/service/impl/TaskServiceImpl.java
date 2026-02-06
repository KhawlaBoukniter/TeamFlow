package com.teamflow.service.impl;

import com.teamflow.dto.TaskDTO;
import com.teamflow.entity.ProjectColumn;
import com.teamflow.entity.Task;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ColumnRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.service.interfaces.TaskService;
import lombok.RequiredArgsConstructor;
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

    @Override
    @Transactional(readOnly = true)
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
    public TaskDTO getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return toDTO(task);
    }

    @Override
    @Transactional
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
        return toDTO(savedTask);
    }

    @Override
    @Transactional
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
        return toDTO(updatedTask);
    }

    @Override
    @Transactional
    public TaskDTO moveTask(Long id, Long targetColumnId) {
        Task task = taskRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        ProjectColumn targetColumn = columnRepository.findById(targetColumnId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found with id: " + targetColumnId));

        task.setColumn(targetColumn);
        Task updatedTask = taskRepository.save(task);
        return toDTO(updatedTask);
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setDeletedAt(LocalDateTime.now());
        taskRepository.save(task);
    }

    @Override
    @Transactional
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

        return toAssignmentDTO(savedAssignment);
    }

    @Override
    @Transactional
    public void removeAssignment(Long taskId, Long userId) {
        com.teamflow.entity.TaskAssignment assignment = taskAssignmentRepository.findByTask_IdAndUser_Id(taskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Assignment not found for task " + taskId + " and user " + userId));

        taskAssignmentRepository.delete(assignment);
    }

    private TaskDTO toDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setPriority(task.getPriority());
        dto.setDueDate(task.getDueDate());
        dto.setBlocked(task.isBlocked());
        dto.setColumnId(task.getColumn().getId());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        if (task.getAssignments() != null) {
            dto.setAssignments(task.getAssignments().stream()
                    .map(this::toAssignmentDTO)
                    .collect(Collectors.toList()));
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
