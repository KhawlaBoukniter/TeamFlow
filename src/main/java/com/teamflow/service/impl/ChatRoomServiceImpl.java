package com.teamflow.service.impl;

import com.teamflow.dto.ChatNotificationDTO;
import com.teamflow.dto.ChatRoomDTO;
import com.teamflow.entity.ChatRoom;
import com.teamflow.entity.Project;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ChatRoomRepository;
import com.teamflow.repository.MembershipRepository;
import com.teamflow.repository.MessageRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.service.interfaces.ChatRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChatRoomServiceImpl implements ChatRoomService {

    private final ProjectRepository projectRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final MembershipRepository membershipRepository;
    private final MessageRepository messageRepository;

    @Override
    @Transactional
    public ChatRoomDTO getChatRoomByProject(Long projectId) {
        if (projectId == null) {
            throw new IllegalArgumentException("Project ID cannot be null");
        }
        final Long pid = projectId;
        return chatRoomRepository.findByProjectIdAndDeletedAtIsNull(pid)
                .map(this::toDTO)
                .orElseGet(() -> {
                    Project project = projectRepository.findById(pid)
                            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + pid));
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

    @Override
    @Transactional(readOnly = true)
    public ChatNotificationDTO getUnreadCount(Long projectId, Long userId) {
        ChatRoom chatRoom = chatRoomRepository.findByProjectIdAndDeletedAtIsNull(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found for project: " + projectId));

        return membershipRepository.findByProjectIdAndUserIdAndDeletedAtIsNull(projectId, userId)
                .map(membership -> {
                    LocalDateTime lastReadAt = membership.getLastReadAt();
                    if (lastReadAt == null) {
                        lastReadAt = membership.getJoinedAt().minusSeconds(1);
                    }
                    long unreadCount = messageRepository.countByChatRoomIdAndCreatedAtAfter(chatRoom.getId(),
                            lastReadAt);
                    return new ChatNotificationDTO(chatRoom.getId(), projectId, unreadCount);
                })
                .orElseGet(() -> new ChatNotificationDTO(chatRoom.getId(), projectId, 0L));
    }

    @Override
    @Transactional
    public void markAsRead(Long projectId, Long userId) {
        membershipRepository.findByProjectIdAndUserIdAndDeletedAtIsNull(projectId, userId)
                .ifPresent(membership -> {
                    membership.setLastReadAt(LocalDateTime.now());
                    membershipRepository.save(membership);
                });
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
