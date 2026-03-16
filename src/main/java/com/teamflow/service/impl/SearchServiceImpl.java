package com.teamflow.service.impl;

import com.teamflow.dto.SearchResultDTO;
import com.teamflow.entity.Project;
import com.teamflow.entity.Task;
import com.teamflow.entity.User;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.UserRepository;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SearchResultDTO> search(String query) {
        if (query == null || query.isBlank() || query.length() < 2) {
            return new ArrayList<>();
        }

        Long userId = SecurityUtils.getCurrentUserId();
        List<SearchResultDTO> results = new ArrayList<>();

        // 1. Search Projects
        List<Project> projects = projectRepository.searchProjects(query, userId);
        results.addAll(projects.stream()
                .map(p -> SearchResultDTO.builder()
                        .type("PROJECT")
                        .id(p.getId())
                        .title(p.getName())
                        .subtitle("Project • " + (p.getOwner().getId().equals(userId) ? "Owner" : "Member"))
                        .link("/projects/" + p.getId() + "/board")
                        .build())
                .collect(Collectors.toList()));

        // 2. Search Tasks
        List<Task> tasks = taskRepository.searchTasks(query, userId);
        results.addAll(tasks.stream()
                .map(t -> SearchResultDTO.builder()
                        .type("TASK")
                        .id(t.getId())
                        .title(t.getTitle())
                        .subtitle("Task • " + t.getColumn().getProject().getName())
                        .link("/projects/" + t.getColumn().getProject().getId() + "/board")
                        .build())
                .collect(Collectors.toList()));

        // 3. Search Users (Members)
        // We can reuse the existing search but limit results
        results.addAll(userRepository
                .findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, PageRequest.of(0, 5))
                .getContent().stream()
                .map(u -> SearchResultDTO.builder()
                        .type("USER")
                        .id(u.getId())
                        .title(u.getFullName())
                        .subtitle("User • " + u.getEmail())
                        .link("/admin/users") // Or profile if we implement other user profiles
                        .build())
                .collect(Collectors.toList()));

        return results;
    }
}
