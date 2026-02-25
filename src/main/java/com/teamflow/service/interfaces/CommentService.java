package com.teamflow.service.interfaces;

import com.teamflow.dto.CommentDTO;
import java.util.List;

public interface CommentService {
    List<CommentDTO> getCommentsByTaskId(Long taskId);

    CommentDTO createComment(Long taskId, CommentDTO dto);

    CommentDTO updateComment(Long id, CommentDTO dto);

    void deleteComment(Long id);
}
