package com.teamflow.controller;

import com.teamflow.dto.DashboardDTO;
import com.teamflow.dto.TaskDTO;
import com.teamflow.service.interfaces.DashboardService;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardDTO> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<List<TaskDTO>> getMyActiveTasks() {
        return ResponseEntity.ok(dashboardService.getMyActiveTasks());
    }
}
