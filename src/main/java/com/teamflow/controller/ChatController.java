package com.teamflow.controller;

import com.teamflow.dto.ChatNotificationDTO;
import com.teamflow.dto.ChatRoomDTO;
import com.teamflow.dto.MessageDTO;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.ChatRoomService;
import com.teamflow.service.interfaces.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRoomService chatRoomService;
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/projects/{projectId}/chat-room")
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ChatRoomDTO getChatRoom(@PathVariable Long projectId) {
        return chatRoomService.getChatRoomByProject(projectId);
    }

    @GetMapping("/chat-rooms/{roomId}/messages")
    @PreAuthorize("@projectSecurity.isMemberForRoom(#roomId)")
    public List<MessageDTO> getMessageHistory(@PathVariable Long roomId) {
        return messageService.getMessagesForRoom(roomId);
    }

    @MessageMapping("/chat/{roomId}")
    public void handleChatMessage(@DestinationVariable Long roomId, MessageDTO message) {
        message.setChatRoomId(roomId);

        MessageDTO savedMessage = messageService.saveMessage(message);
        if (savedMessage != null) {
            messagingTemplate.convertAndSend("/topic/chat/" + roomId, savedMessage);
        }
    }

    @GetMapping("/projects/{projectId}/chat/unread-count")
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public ChatNotificationDTO getUnreadCount(@PathVariable Long projectId) {
        Long userId = SecurityUtils.getCurrentUserId();
        return chatRoomService.getUnreadCount(projectId, userId);
    }

    @PostMapping("/projects/{projectId}/chat/mark-as-read")
    @PreAuthorize("@projectSecurity.isMember(#projectId)")
    public void markAsRead(@PathVariable Long projectId) {
        Long userId = SecurityUtils.getCurrentUserId();
        chatRoomService.markAsRead(projectId, userId);
    }
}
