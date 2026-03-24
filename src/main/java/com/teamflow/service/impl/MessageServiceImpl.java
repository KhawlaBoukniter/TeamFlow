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
import com.teamflow.entity.Project;
import com.teamflow.entity.Membership;
import com.teamflow.entity.enums.RoleInProject;
import com.teamflow.service.interfaces.MessageService;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.NotificationService;
import com.teamflow.entity.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    @SuppressWarnings("null")
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

        if (dto.getParentMessageId() != null) {
            messageRepository.findById(dto.getParentMessageId())
                    .ifPresent(parent -> message.setParentMessage(parent));
        }

        Message savedMessage = messageRepository.save(message);

        // Update sender's lastReadAt in their membership
        Long projectId = chatRoom.getProject().getId();
        membershipRepository.findByProjectIdAndUserIdAndDeletedAtIsNull(projectId, senderId)
                .ifPresentOrElse(
                        membership -> {
                            membership.setLastReadAt(LocalDateTime.now());
                            membershipRepository.save(membership);
                        },
                        () -> {
                            // If no membership, check if user has access (Admin or Owner) and create one to
                            // track status
                            User user = sender; // already fetched above
                            Project project = chatRoom.getProject(); // already have chatRoom

                            if (user != null && project != null && (user.isAdmin() ||
                                    (project.getOwner() != null && project.getOwner().getId().equals(senderId)))) {
                                Membership membership = new Membership();
                                membership.setProject(project);
                                membership.setUser(user);
                                membership.setRoleInProject(
                                        project.getOwner() != null && project.getOwner().getId().equals(senderId)
                                                ? RoleInProject.MANAGER
                                                : RoleInProject.MEMBER);
                                membership.setJoinedAt(LocalDateTime.now().minusSeconds(1));
                                membership.setLastReadAt(LocalDateTime.now());
                                membershipRepository.save(membership);
                            }
                        });

        auditLogService.logAction("SEND_MESSAGE", "Message", savedMessage.getId(), projectId,
                "Message sent to " + chatRoom.getName());

        // Handle Mentions for Notifications
        handleMentions(savedMessage, projectId, sender);

        return toDTO(savedMessage);
    }

    private void handleMentions(Message message, Long projectId, User sender) {
        String content = message.getContent();
        if (content == null || !content.contains("@"))
            return;

        // Detect @everyone
        if (content.toLowerCase().contains("@everyone")) {
            List<Membership> projectMembers = membershipRepository.findByProjectIdAndDeletedAtIsNull(projectId);
            for (Membership m : projectMembers) {
                if (!m.getUser().getId().equals(sender.getId())) {
                    notificationService.createNotification(
                            m.getUser().getId(),
                            sender.getFullName() + " mentioned everyone in chat",
                            NotificationType.CHAT_MENTION,
                            "CHAT",
                            message.getChatRoom().getId(),
                            projectId);
                }
            }
            return; // If @everyone is present, we might skip individual mentions to avoid double
                    // notifications
        }

        // Detect individual mentions: @UserName
        // We look for memberships in this project and check if their names are
        // mentioned
        List<Membership> members = membershipRepository.findByProjectIdAndDeletedAtIsNull(projectId);
        for (Membership m : members) {
            String name = m.getUser().getFullName();
            if (name == null || m.getUser().getId().equals(sender.getId()))
                continue;

            // Check for @Name with word boundary
            String regex = "@" + Pattern.quote(name) + "\\b";
            if (Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(content).find()) {
                notificationService.createNotification(
                        m.getUser().getId(),
                        sender.getFullName() + " mentioned you in chat",
                        NotificationType.CHAT_MENTION,
                        "CHAT",
                        message.getChatRoom().getId(),
                        projectId);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageDTO> getMessagesForRoom(Long roomId) {
        return messageRepository.findByChatRoomIdAndDeletedAtIsNullOrderByCreatedAtAsc(roomId).stream()
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

        if (message.getParentMessage() != null) {
            dto.setParentMessageId(message.getParentMessage().getId());
            dto.setParentMessageContent(message.getParentMessage().getContent());
            dto.setParentMessageSenderName(message.getParentMessage().getSender().getFullName());
        }

        if (message.getAttachments() != null && !message.getAttachments().isEmpty()) {
            dto.setAttachments(message.getAttachments().stream()
                    .map(att -> com.teamflow.dto.AttachmentDTO.builder()
                            .id(att.getId())
                            .fileName(att.getFileName())
                            .fileUrl(att.getFileUrl())
                            .fileType(att.getFileType())
                            .fileSize(att.getFileSize())
                            .uploadedByUserName(
                                    att.getUploadedBy() != null ? att.getUploadedBy().getFullName() : "Unknown")
                            .createdAt(att.getCreatedAt())
                            .build())
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}
