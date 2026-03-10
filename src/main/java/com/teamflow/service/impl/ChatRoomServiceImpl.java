package com.teamflow.service.impl;

import com.teamflow.dto.ChatRoomDTO;
import com.teamflow.entity.ChatRoom;
import com.teamflow.entity.Project;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ChatRoomRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.service.interfaces.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatRoomServiceImpl implements ChatRoomService {

    private final ProjectRepository projectRepository;
    private final ChatRoomRepository chatRoomRepository;

    @Override
    @Transactional
    public ChatRoomDTO getChatRoomByProject(Long projectId) {
        return chatRoomRepository.findByProjectIdAndDeletedAtIsNull(projectId)
                .map(this::toDTO)
                .orElseGet(() -> {
                    Project project = projectRepository.findById(projectId)
                            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
                    ChatRoom newRoom = createChatRoom(project);
                    return toDTO(newRoom);
                });
    }

    @Override
    @Transactional
    public ChatRoom createChatRoom(Project project) {
        ChatRoom chatRoom = new ChatRoom();
        chatRoom.setName("General - " + project.getName());
        chatRoom.setProject(project);
        return chatRoomRepository.save(chatRoom);
    }

    private ChatRoomDTO toDTO(ChatRoom chatRoom) {
        ChatRoomDTO dto = new ChatRoomDTO();
        dto.setId(chatRoom.getId());
        dto.setName(chatRoom.getName());
        dto.setProjectId(chatRoom.getProject().getId());
        dto.setCreatedAt(chatRoom.getCreatedAt());
        return dto;
    }
}
