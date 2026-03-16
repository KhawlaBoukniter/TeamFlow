package com.teamflow.service.interfaces;

import com.teamflow.dto.PasswordChangeDTO;
import com.teamflow.dto.UserDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    Page<UserDTO> searchUsers(String query, Pageable pageable);

    Page<UserDTO> getAllUsers(Pageable pageable);

    UserDTO getUserById(Long id);

    UserDTO updateUser(Long id, UserDTO dto);

    void deleteUser(Long id);

    UserDTO toggleActive(Long id);

    UserDTO getProfile();

    UserDTO updateProfile(UserDTO dto);

    void changePassword(PasswordChangeDTO dto);
}
