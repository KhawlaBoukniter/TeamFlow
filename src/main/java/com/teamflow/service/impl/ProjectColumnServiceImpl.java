package com.teamflow.service.impl;

import com.teamflow.dto.ProjectColumnDTO;
import com.teamflow.entity.Project;
import com.teamflow.entity.ProjectColumn;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ColumnRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.service.interfaces.ProjectColumnService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectColumnServiceImpl implements ProjectColumnService {

    private final ColumnRepository columnRepository;
    private final ProjectRepository projectRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectColumnDTO> getColumnsByProjectId(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        return project.getColumns().stream()
                .filter(c -> c.getDeletedAt() == null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectColumnDTO getColumnById(Long id) {
        ProjectColumn column = columnRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found with id: " + id));
        return toDTO(column);
    }

    @Override
    @Transactional
    public ProjectColumnDTO createColumn(Long projectId, ProjectColumnDTO dto) {
        Project project = projectRepository.findById(projectId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        ProjectColumn column = new ProjectColumn();
        column.setName(dto.getName());
        column.setOrderIndex(dto.getOrderIndex());
        column.setRequiresValidation(dto.isRequiresValidation());
        column.setFinal(dto.isFinal());
        column.setProject(project);

        ProjectColumn savedColumn = columnRepository.save(column);
        return toDTO(savedColumn);
    }

    @Override
    @Transactional
    public ProjectColumnDTO updateColumn(Long id, ProjectColumnDTO dto) {
        ProjectColumn column = columnRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found with id: " + id));

        column.setName(dto.getName());
        column.setOrderIndex(dto.getOrderIndex());
        column.setRequiresValidation(dto.isRequiresValidation());
        column.setFinal(dto.isFinal());

        ProjectColumn updatedColumn = columnRepository.save(column);
        return toDTO(updatedColumn);
    }

    @Override
    @Transactional
    public void deleteColumn(Long id) {
        ProjectColumn column = columnRepository.findById(id)
                .filter(c -> c.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found with id: " + id));

        column.setDeletedAt(LocalDateTime.now());
        columnRepository.save(column);
    }

    private ProjectColumnDTO toDTO(ProjectColumn column) {
        ProjectColumnDTO dto = new ProjectColumnDTO();
        dto.setId(column.getId());
        dto.setName(column.getName());
        dto.setOrderIndex(column.getOrderIndex());
        dto.setRequiresValidation(column.isRequiresValidation());
        dto.setFinal(column.isFinal());
        dto.setProjectId(column.getProject().getId());
        dto.setCreatedAt(column.getCreatedAt());
        dto.setUpdatedAt(column.getUpdatedAt());
        return dto;
    }
}
