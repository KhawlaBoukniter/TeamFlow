package com.teamflow.service.interfaces;

import com.teamflow.dto.auth.AuthResponse;
import com.teamflow.dto.auth.LoginRequest;
import com.teamflow.dto.auth.RegisterRequest;
import com.teamflow.dto.auth.TokenRefreshRequest;
import com.teamflow.dto.auth.ChangePasswordRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(TokenRefreshRequest request);

    void logout();

    void changePassword(ChangePasswordRequest request);
}
