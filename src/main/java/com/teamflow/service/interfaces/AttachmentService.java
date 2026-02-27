package com.teamflow.service.interfaces;

import com.teamflow.dto.AttachmentDTO;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AttachmentService {
    AttachmentDTO uploadAttachment(Long taskId, MultipartFile file);

    Resource downloadAttachment(Long attachmentId);

    void deleteAttachment(Long attachmentId);

    List<AttachmentDTO> getAttachmentsByTaskId(Long taskId);
}
