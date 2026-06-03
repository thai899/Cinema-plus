package com.cinemaplus.services;

import com.cinemaplus.entities.User;
import com.cinemaplus.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + id));
    }

    /**
     * Cập nhật trạng thái người dùng (Ví dụ: ACTIVE, LOCKED).
     */
    public User updateUserStatus(Long id, String status) {
        if (!"ACTIVE".equalsIgnoreCase(status) && !"LOCKED".equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ! Chỉ chấp nhận ACTIVE hoặc LOCKED.");
        }

        User user = getUserById(id);
        user.setStatus(status.toUpperCase());
        return userRepository.save(user);
    }
}
