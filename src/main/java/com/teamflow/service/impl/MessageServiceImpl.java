package com.teamflow.service.impl;

import com.teamflow.dto.MessageDTO;
import com.teamflow.entity.ChatRoom;
import com.teamflow.entity.Message;
import com.teamflow.entity.User;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ChatRoomRepository;
import com.teamflow.repository.MessageRepository;
import com.teamflow.repository.UserRepository;
import com.teamflow.repository.MembershipRepository;
import com.teamflow.service.interfaces.MessageService;
import com.teamflow.service.interfaces.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public MessageDTO saveMessage(MessageDTO dto) {
        Long chatRoomId = dto.getChatRoomId();
        Long senderId = dto.getSenderId();

        if (chatRoomId == null) {
            throw new IllegalArgumentException("Chat room ID cannot be null");
        }
        if (senderId == null) {
            throw new IllegalArgumentException("Sender ID cannot be null");
        }

        ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        Message message = new Message();
        message.setContent(dto.getContent());
        message.setChatRoom(chatRoom);
        message.setSender(sender);

        Message savedMessage = messageRepository.save(message);

        // Update sender's lastReadAt in their membership
        Long projectId = chatRoom.getProject().getId();
        membershipRepository.findByProjectIdAndUserIdAndDeletedAtIsNull(projectId, senderId)
                .ifPresent(membership -> {
                    membership.setLastReadAt(LocalDateTime.now());
                    membershipRepository.save(membership);
                });

        auditLogService.logAction("SEND_MESSAGE", "Message", savedMessage.getId(), projectId,
                "Message sent to " + chatRoom.getName());

        return toDTO(savedMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> getMessagesForRoom(Long roomId) {
        return messageRepository.findByChatRoomIdAndDeletedAtIsNull(roomId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private MessageDTO toDTO(Message message) {
        MessageDTO dto = new MessageDTO();
        dto.setId(message.getId());
        dto.setContent(message.getContent());
        dto.setSenderId(message.getSender().getId());
        dto.setSenderName(message.getSender().getFullName());
        dto.setChatRoomId(message.getChatRoom().getId());
        dto.setCreatedAt(message.getCreatedAt());
        return dto;
    }
}
