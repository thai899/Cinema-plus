package com.cinemaplus.controllers;

import com.cinemaplus.entities.Role;
import com.cinemaplus.entities.User;
import com.cinemaplus.repositories.RoleRepository;
import com.cinemaplus.repositories.UserRepository;
import com.cinemaplus.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * API PATCH khóa/mở khóa tài khoản người dùng
     * Request body ví dụ: { "status": "LOCKED" } hoặc { "status": "ACTIVE" }
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(
            @PathVariable Long id, 
            @RequestBody Map<String, String> requestBody) {
        
        String status = requestBody.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Trường 'status' là bắt buộc trong JSON body!"));
        }

        User updatedUser = userService.updateUserStatus(id, status);
        return ResponseEntity.ok(Map.of(
            "message", "Cập nhật trạng thái người dùng thành công!",
            "userId", updatedUser.getId(),
            "username", updatedUser.getUsername(),
            "status", updatedUser.getStatus()
        ));
    }

    /**
     * API POST tạo mới tài khoản nhân sự (STAFF / MANAGER)
     * Body: { username, password, email, fullName, phone, roleName }
     */
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String email    = body.get("email");
        String fullName = body.get("fullName");
        String phone    = body.getOrDefault("phone", "");
        String roleName = body.getOrDefault("roleName", "ROLE_STAFF");

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tên đăng nhập đã tồn tại!"));
        }
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email đã được sử dụng!"));
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role không hợp lệ: " + roleName));

        User newUser = new User();
        newUser.setUsername(username);
        newUser.setPassword(password); // plain text, khớp với AuthController hiện tại
        newUser.setEmail(email);
        newUser.setFullName(fullName);
        newUser.setPhone(phone);
        newUser.setRole(role);
        newUser.setStatus("ACTIVE");
        newUser.setLoyaltyPoints(0);
        newUser.setCreatedAt(LocalDateTime.now());
        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of(
            "message", "Tạo tài khoản nhân sự thành công!",
            "username", username,
            "role", roleName
        ));
    }

    /**
     * API PUT đổi Role của người dùng
     * Body: { "roleName": "ROLE_MANAGER" }
     */
    @PutMapping("/{id}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String roleName = body.get("roleName");
        if (roleName == null || roleName.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Trường roleName là bắt buộc!"));
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại: " + id));
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role không hợp lệ: " + roleName));
        user.setRole(role);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
            "message", "Đổi quyền thành công!",
            "userId", id,
            "newRole", roleName
        ));
    }

    /**
     * API DELETE xóa tài khoản (chỉ customer, không cho xóa admin/manager)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));
        String roleName = user.getRole().getName();
        if ("ROLE_ADMIN".equals(roleName)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Không thể xóa tài khoản Admin!"));
        }
        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "Xóa tài khoản thành công!", "id", id));
    }
}
