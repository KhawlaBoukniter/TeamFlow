package com.teamflow.service.interfaces;

import com.teamflow.dto.ChatRoomDTO;
import com.teamflow.entity.ChatRoom;
import com.teamflow.entity.Project;

public interface ChatRoomService {
    ChatRoomDTO getChatRoomByProject(Long projectId);

    ChatRoom createChatRoom(Project project);
}
