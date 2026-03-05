package com.teamflow.service.impl;

import com.teamflow.dto.ChatRoomDTO;
import com.teamflow.entity.ChatRoom;
import com.teamflow.entity.Project;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ChatRoomRepository;
import com.teamflow.service.interfaces.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatRoomServiceImpl implements ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;

    @Override
    @Transactional(readOnly = true)
    public ChatRoomDTO getChatRoomByProject(Long projectId) {
        ChatRoom chatRoom = chatRoomRepository.findAll().stream()
                .filter(cr -> cr.getProject().getId().equals(projectId) && cr.getDeletedAt() == null)
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found for project: " + projectId));
        return toDTO(chatRoom);
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
