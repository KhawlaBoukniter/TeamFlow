package com.teamflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamflow.entity.enums.Priority;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TaskSummaryDTO {
    private Long id;
    private String title;
    private Priority priority;
    private boolean isBlocked;

    @JsonProperty("columnId")
    private Long columnId;

    private com.teamflow.dto.UserDTO assignee;
}
