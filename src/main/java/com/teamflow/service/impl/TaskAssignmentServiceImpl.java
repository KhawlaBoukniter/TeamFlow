package com.teamflow.service.impl;

import com.teamflow.dto.TaskAssignmentDTO;
import com.teamflow.entity.Task;
import com.teamflow.entity.TaskAssignment;
import com.teamflow.entity.User;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.TaskAssignmentRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.UserRepository;
import com.teamflow.service.interfaces.TaskAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskAssignmentServiceImpl implements TaskAssignmentService {

    private final TaskAssignmentRepository taskAssignmentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TaskAssignmentDTO> getAssignmentsByTaskId(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        return task.getAssignments().stream()
                .filter(a -> a.getDeletedAt() == null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskAssignmentDTO assignUserToTask(TaskAssignmentDTO dto) {
        Task task = taskRepository.findById(dto.getTaskId())
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + dto.getTaskId()));

        User user = userRepository.findById(dto.getUserId())
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));

        // Check if assignment already exists
        boolean exists = task.getAssignments().stream()
                .anyMatch(a -> a.getUser().getId().equals(user.getId()) && a.getDeletedAt() == null);

        if (exists) {
            throw new IllegalArgumentException("User is already assigned to this task");
        }

        TaskAssignment assignment = new TaskAssignment();
        assignment.setTask(task);
        assignment.setUser(user);
        assignment.setRoleInTask(dto.getRoleInTask());
        assignment.setAssignedAt(LocalDateTime.now());

        TaskAssignment savedAssignment = taskAssignmentRepository.save(assignment);
        return toDTO(savedAssignment);
    }

    @Override
    @Transactional
    public TaskAssignmentDTO updateAssignmentRole(Long id, TaskAssignmentDTO dto) {
        TaskAssignment assignment = taskAssignmentRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        assignment.setRoleInTask(dto.getRoleInTask());

        TaskAssignment updatedAssignment = taskAssignmentRepository.save(assignment);
        return toDTO(updatedAssignment);
    }

    @Override
    @Transactional
    public void removeAssignment(Long id) {
        TaskAssignment assignment = taskAssignmentRepository.findById(id)
                .filter(a -> a.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with id: " + id));

        assignment.setDeletedAt(LocalDateTime.now());
        taskAssignmentRepository.save(assignment);
    }

    private TaskAssignmentDTO toDTO(TaskAssignment assignment) {
        TaskAssignmentDTO dto = new TaskAssignmentDTO();
        dto.setId(assignment.getId());
        dto.setTaskId(assignment.getTask().getId());
        dto.setUserId(assignment.getUser().getId());
        dto.setUserName(assignment.getUser().getFullName());
        dto.setUserEmail(assignment.getUser().getEmail());
        dto.setRoleInTask(assignment.getRoleInTask());
        dto.setAssignedAt(assignment.getAssignedAt());
        dto.setCreatedAt(assignment.getCreatedAt());
        return dto;
    }
}
