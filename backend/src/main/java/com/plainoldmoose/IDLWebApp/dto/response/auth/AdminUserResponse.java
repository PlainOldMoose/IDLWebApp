package com.plainoldmoose.IDLWebApp.dto.response.auth;

public record AdminUserResponse(
        String username,
        boolean isAdmin
) {}