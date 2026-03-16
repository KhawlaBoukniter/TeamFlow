package com.teamflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResultDTO {
    private String type; // PROJECT, TASK, USER
    private Long id;
    private String title;
    private String subtitle;
    private String link;
}
