package com.teamflow.service.interfaces;

import com.teamflow.dto.UserDTO;
import java.util.List;

public interface UserService {
    List<UserDTO> searchUsers(String query);
}
