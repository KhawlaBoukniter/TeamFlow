package com.teamflow.service.impl;

import com.teamflow.dto.SubTaskDTO;
import com.teamflow.entity.SubTask;
import com.teamflow.entity.Task;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.SubTaskRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.service.interfaces.SubTaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubTaskServiceImpl implements SubTaskService {

    private final SubTaskRepository subTaskRepository;
    private final TaskRepository taskRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SubTaskDTO> getSubTasksByTaskId(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        return task.getSubTasks().stream()
                .filter(st -> st.getDeletedAt() == null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public SubTaskDTO createSubTask(Long taskId, SubTaskDTO dto) {
        Task task = taskRepository.findById(taskId)
                .filter(t -> t.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        SubTask subTask = new SubTask();
        subTask.setTitle(dto.getTitle());
        subTask.setDone(dto.isDone());
        subTask.setTask(task);

        SubTask savedSubTask = subTaskRepository.save(subTask);
        return toDTO(savedSubTask);
    }

    @Override
    @Transactional
    public SubTaskDTO updateSubTask(Long id, SubTaskDTO dto) {
        SubTask subTask = subTaskRepository.findById(id)
                .filter(st -> st.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("SubTask not found with id: " + id));

        subTask.setTitle(dto.getTitle());
        subTask.setDone(dto.isDone());

        SubTask updatedSubTask = subTaskRepository.save(subTask);
        return toDTO(updatedSubTask);
    }

    @Override
    @Transactional
    public void deleteSubTask(Long id) {
        SubTask subTask = subTaskRepository.findById(id)
                .filter(st -> st.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("SubTask not found with id: " + id));

        subTask.setDeletedAt(LocalDateTime.now());
        subTaskRepository.save(subTask);
    }

    private SubTaskDTO toDTO(SubTask subTask) {
        SubTaskDTO dto = new SubTaskDTO();
        dto.setId(subTask.getId());
        dto.setTitle(subTask.getTitle());
        dto.setDone(subTask.isDone());
        dto.setTaskId(subTask.getTask().getId());
        dto.setCreatedAt(subTask.getCreatedAt());
        dto.setUpdatedAt(subTask.getUpdatedAt());
        return dto;
    }
}
