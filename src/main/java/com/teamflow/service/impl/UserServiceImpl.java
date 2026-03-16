package com.teamflow.service.impl;

import com.teamflow.dto.PasswordChangeDTO;
import com.teamflow.dto.UserDTO;
import com.teamflow.entity.User;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.UserRepository;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Page<UserDTO> searchUsers(String query, Pageable pageable) {
        return userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, pageable)
                .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public Page<UserDTO> getAllUsers(Pageable pageable) {
        return userRepository.findByDeletedAtIsNull(pageable)
                .map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        User user = userRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toDTO(user);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserDTO updateUser(Long id, UserDTO dto) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        User user = userRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            user.setFullName(dto.getFullName());
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            user.setEmail(dto.getEmail().toLowerCase().trim());
        }
        if (dto.isAdmin() != user.isAdmin()) {
            user.setAdmin(dto.isAdmin());
        }

        User savedUser = userRepository.save(user);
        auditLogService.logAction("UPDATE", "User", savedUser.getId(), "Updated user details");
        return toDTO(savedUser);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        User user = userRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setDeletedAt(LocalDateTime.now());
        user.setActive(false);
        userRepository.save(user);
        auditLogService.logAction("DELETE", "User", user.getId(), "Soft deleted user");
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserDTO toggleActive(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        User user = userRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setActive(!user.isActive());
        User savedUser = userRepository.save(user);
        auditLogService.logAction("TOGGLE_ACTIVE", "User", savedUser.getId(),
                "Toggled user active status to: " + savedUser.isActive());
        return toDTO(savedUser);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getProfile() {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toDTO(user);
    }

    @Override
    @Transactional
    public UserDTO updateProfile(UserDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            user.setFullName(dto.getFullName());
        }

        User savedUser = userRepository.save(user);
        auditLogService.logAction("UPDATE_PROFILE", "User", savedUser.getId(), "Updated personal profile");
        return toDTO(savedUser);
    }

    @Override
    @Transactional
    public void changePassword(PasswordChangeDTO dto) {
        Long userId = SecurityUtils.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new IllegalArgumentException("New passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
        auditLogService.logAction("CHANGE_PASSWORD", "User", user.getId(), "Changed account password");
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setActive(user.isActive());
        dto.setAdmin(user.isAdmin());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLastLogin(user.getLastLogin());
        return dto;
    }
}
