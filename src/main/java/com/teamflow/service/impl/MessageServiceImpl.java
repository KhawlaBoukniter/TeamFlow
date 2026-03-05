package com.teamflow.service.impl;

import com.teamflow.dto.MessageDTO;
import com.teamflow.entity.ChatRoom;
import com.teamflow.entity.Message;
import com.teamflow.entity.User;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ChatRoomRepository;
import com.teamflow.repository.MessageRepository;
import com.teamflow.repository.UserRepository;
import com.teamflow.service.interfaces.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public MessageDTO saveMessage(MessageDTO dto) {
        ChatRoom chatRoom = chatRoomRepository.findById(dto.getChatRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat room not found"));
        User sender = userRepository.findById(dto.getSenderId())
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));

        Message message = new Message();
        message.setContent(dto.getContent());
        message.setChatRoom(chatRoom);
        message.setSender(sender);

        Message savedMessage = messageRepository.save(message);
        return toDTO(savedMessage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> getMessagesForRoom(Long roomId) {
        return messageRepository.findAll().stream()
                .filter(m -> m.getChatRoom().getId().equals(roomId) && m.getDeletedAt() == null)
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
