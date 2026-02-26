package com.teamflow.service.interfaces;

import com.teamflow.dto.UserDTO;
import java.util.List;

public interface UserService {
    List<UserDTO> searchUsers(String query);

    List<UserDTO> getAllUsers();

    UserDTO getUserById(Long id);

    UserDTO updateUser(Long id, UserDTO dto);

    void deleteUser(Long id);

    UserDTO toggleActive(Long id);
}
