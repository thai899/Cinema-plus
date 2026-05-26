package com.cinemaplus.controllers;

import com.cinemaplus.dtos.requests.LoginRequest;
import com.cinemaplus.dtos.responses.JwtResponse;
import com.cinemaplus.entities.User;
import com.cinemaplus.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        // 1. Tìm user trong DB theo username công thức chuẩn
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Sai tài khoản hoặc mật khẩu rồi Thái ơi!");
        }

        // 2. Kiểm tra mật khẩu (Lưu ý: Đồ án thực tế dùng BCrypt, ở đây so khớp chuỗi thô để test nhanh)
        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Sai tài khoản hoặc mật khẩu rồi Thái ơi!");
        }

        // 3. Kiểm tra trạng thái tài khoản
        if (!"ACTIVE".equals(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Tài khoản này đã bị khóa!");
        }

        // 4. Đăng nhập thành công -> Trả về Token giả lập và Quyền thực tế từ DB
        String mockToken = "mock-jwt-token-for-cinema-plus-project-123456789";
        String userRole = user.getRole().getName(); // Lấy tên Role (e.g., ROLE_ADMIN)

        return ResponseEntity.ok(new JwtResponse(mockToken, user.getUsername(), userRole));
    }
}