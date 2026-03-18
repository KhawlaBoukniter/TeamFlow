package com.teamflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDTO {
    private Long id;
    private Long messageId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private String uploadedByUserName;
    private LocalDateTime createdAt;
}
