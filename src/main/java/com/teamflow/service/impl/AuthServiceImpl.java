package com.teamflow.service.impl;

import com.teamflow.dto.auth.AuthResponse;
import com.teamflow.dto.auth.ChangePasswordRequest;
import com.teamflow.dto.auth.LoginRequest;
import com.teamflow.dto.auth.RegisterRequest;
import com.teamflow.dto.auth.TokenRefreshRequest;
import com.teamflow.service.interfaces.RefreshTokenService;
import com.teamflow.entity.RefreshToken;
import com.teamflow.entity.User;
import com.teamflow.exception.InvalidCredentialsException;
import com.teamflow.repository.UserRepository;
import com.teamflow.security.CustomUserDetails;
import com.teamflow.security.JwtService;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setActive(true);
        user.setAdmin(false);

        userRepository.save(user);

        auditLogService.logAction("REGISTER", "User", user.getId(), "User registered successfully", user);

        return generateAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
        } catch (Exception e) {
            System.err.println("Authentication failed for user: " + request.getEmail() + " - " + e.getMessage());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        auditLogService.logAction("LOGIN", "User", user.getId(), "User logged in successfully", user);

        return generateAuthResponse(user);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(TokenRefreshRequest request) {
        return refreshTokenService.findByToken(request.getRefreshToken())
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    CustomUserDetails userDetails = new CustomUserDetails(user);
                    String token = jwtService.generateToken(generateExtraClaims(user), userDetails);
                    return buildAuthResponse(user, token, request.getRefreshToken());
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    @Override
    @Transactional
    public void logout() {
        Long userId = SecurityUtils.getCurrentUserId();
        refreshTokenService.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        if (userId == null) {
            throw new InvalidCredentialsException("User not authenticated");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidCredentialsException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditLogService.logAction("CHANGE_PASSWORD", "User", user.getId(), "User changed their password");
    }

    private AuthResponse generateAuthResponse(User user) {
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtService.generateToken(generateExtraClaims(user), userDetails);
        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();

        return buildAuthResponse(user, token, refreshToken);
    }

    private Map<String, Object> generateExtraClaims(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", user.getId());
        extraClaims.put("isAdmin", user.isAdmin());
        return extraClaims;
    }

    private AuthResponse buildAuthResponse(User user, String token, String refreshToken) {
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .isAdmin(user.isAdmin())
                .build();
    }
}
