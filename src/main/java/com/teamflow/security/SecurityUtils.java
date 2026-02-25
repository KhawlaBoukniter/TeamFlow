package com.teamflow.security;

import com.teamflow.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            throw new IllegalStateException("No authenticated user found");
        }
        return ((CustomUserDetails) authentication.getPrincipal()).getUser();
    }

    public static Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}
