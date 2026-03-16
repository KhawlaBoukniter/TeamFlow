package com.teamflow.service.impl;

import com.teamflow.dto.ProjectDTO;
import com.teamflow.dto.TaskDTO;
import com.teamflow.service.interfaces.CsvExportService;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CsvExportServiceImpl implements CsvExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Override
    public byte[] exportProjectsToCsv(List<ProjectDTO> projects) {
        StringBuilder csv = new StringBuilder();
        // Header
        csv.append("ID,Name,Description,Status,Type,Created At\n");

        for (ProjectDTO p : projects) {
            csv.append(escapeCsv(p.getId().toString())).append(",")
                    .append(escapeCsv(p.getName())).append(",")
                    .append(escapeCsv(p.getDescription())).append(",")
                    .append(escapeCsv(p.getStatus().toString())).append(",")
                    .append(escapeCsv(p.getType().toString())).append(",")
                    .append(escapeCsv(p.getCreatedAt() != null ? p.getCreatedAt().format(DATE_FORMATTER) : ""))
                    .append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public byte[] exportTasksToCsv(List<TaskDTO> tasks) {
        StringBuilder csv = new StringBuilder();
        // Header
        csv.append("ID,Title,Description,Priority,Status (Column),Blocked,Due Date,Created At\n");

        for (TaskDTO t : tasks) {
            csv.append(escapeCsv(t.getId().toString())).append(",")
                    .append(escapeCsv(t.getTitle())).append(",")
                    .append(escapeCsv(t.getDescription())).append(",")
                    .append(escapeCsv(t.getPriority() != null ? t.getPriority().toString() : "")).append(",")
                    .append(escapeCsv(t.getProjectName() != null ? t.getProjectName() : "")).append(",")
                    .append(escapeCsv(String.valueOf(t.isBlocked()))).append(",")
                    .append(escapeCsv(t.getDueDate() != null ? t.getDueDate().format(DATE_FORMATTER) : "")).append(",")
                    .append(escapeCsv(t.getCreatedAt() != null ? t.getCreatedAt().format(DATE_FORMATTER) : ""))
                    .append("\n");
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value == null)
            return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
