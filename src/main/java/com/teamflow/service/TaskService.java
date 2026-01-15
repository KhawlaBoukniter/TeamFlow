package com.teamflow.service;

import com.teamflow.dto.TaskDTO;
import com.teamflow.entity.ProjectColumn;
import com.teamflow.entity.Task;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ColumnRepository;
import com.teamflow.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ColumnRepository columnRepository;

    public TaskService(TaskRepository taskRepository, ColumnRepository columnRepository) {
        this.taskRepository = taskRepository;
        this.columnRepository = columnRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskDTO> getTasksByColumnId(Long columnId) {
        ProjectColumn column = columnRepository.findById(columnId)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found with id: " + columnId));

        return column.getTasks().stream()
                .filter(t -> t.getDeletedAt() == null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskDTO getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return toDTO(task);
    }

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

    @Transactional
    public void deleteTask(Long id) {
        Task task = taskRepository.findById(id)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setDeletedAt(LocalDateTime.now());
        taskRepository.save(task);
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
        return dto;
    }
}
