package com.cinemaplus.controllers;

import com.cinemaplus.dtos.requests.LoginRequest;
import com.cinemaplus.dtos.responses.JwtResponse;
import com.cinemaplus.entities.User;
import com.cinemaplus.repositories.UserRepository;
import com.cinemaplus.config.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        // 1. Tìm user trong DB theo username công thức chuẩn
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Sai tài khoản hoặc mật khẩu rồi Thái ơi!");
        }

        // 2. Kiểm tra mật khẩu (Lưu ý: Đồ án thực tế dùng BCrypt, ở đây so khớp chuỗi thô để tương thích dữ liệu SQL đầu vào)
        if (!user.getPassword().equals(loginRequest.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Sai tài khoản hoặc mật khẩu rồi Thái ơi!");
        }

        // 3. Kiểm tra trạng thái tài khoản
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Tài khoản này đã bị khóa!");
        }

        // 4. Đăng nhập thành công -> Trả về Token đã được ký HMAC-SHA256 chuẩn mã hóa và Quyền thực tế
        String userRole = user.getRole().getName(); // Lấy tên Role (e.g., ROLE_ADMIN)
        String token = jwtUtils.generateToken(user.getUsername(), userRole);

        return ResponseEntity.ok(new JwtResponse(token, user.getUsername(), userRole));
    }
}