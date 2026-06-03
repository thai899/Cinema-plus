package com.cinemaplus.controllers;

import com.cinemaplus.entities.User;
import com.cinemaplus.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    private UserService userService;

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
}
