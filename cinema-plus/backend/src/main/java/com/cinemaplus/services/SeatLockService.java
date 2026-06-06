package com.cinemaplus.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.util.concurrent.TimeUnit;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.HashSet;

@Service
public class SeatLockService {

    @Autowired
    private StringRedisTemplate redisTemplate;

    private static final long LOCK_TIME_MINUTES = 5;

    private String getLockKey(Long showtimeId, Long seatId) {
        return "seat_lock:" + showtimeId + ":" + seatId;
    }

    public boolean lockSeat(Long showtimeId, Long seatId, String username) {
        try {
            String key = getLockKey(showtimeId, seatId);
            Boolean success = redisTemplate.opsForValue().setIfAbsent(key, username, LOCK_TIME_MINUTES, TimeUnit.MINUTES);
            return Boolean.TRUE.equals(success);
        } catch (Exception e) {
            System.err.println("Redis is offline. Seat locking bypass: " + e.getMessage());
            return true; // Bypass lock when Redis is offline to let the user proceed
        }
    }

    public void unlockSeat(Long showtimeId, Long seatId, String username) {
        try {
            String key = getLockKey(showtimeId, seatId);
            String currentLockUser = redisTemplate.opsForValue().get(key);
            if (username.equals(currentLockUser)) {
                redisTemplate.delete(key);
            }
        } catch (Exception e) {
            System.err.println("Redis is offline. Seat unlock bypass: " + e.getMessage());
        }
    }

    public void unlockAllSeatsForUser(Long showtimeId, String username) {
        try {
            Set<String> keys = redisTemplate.keys("seat_lock:" + showtimeId + ":*");
            if (keys != null) {
                for (String key : keys) {
                    String currentLockUser = redisTemplate.opsForValue().get(key);
                    if (username.equals(currentLockUser)) {
                        redisTemplate.delete(key);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Redis is offline. Seat unlock all bypass: " + e.getMessage());
        }
    }

    public boolean isSeatLocked(Long showtimeId, Long seatId) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(getLockKey(showtimeId, seatId)));
        } catch (Exception e) {
            return false;
        }
    }

    public String getSeatLockUser(Long showtimeId, Long seatId) {
        try {
            return redisTemplate.opsForValue().get(getLockKey(showtimeId, seatId));
        } catch (Exception e) {
            return null;
        }
    }

    public Set<Long> getLockedSeats(Long showtimeId) {
        try {
            Set<String> keys = redisTemplate.keys("seat_lock:" + showtimeId + ":*");
            if (keys == null) return new HashSet<>();
            
            return keys.stream().map(key -> {
                String[] parts = key.split(":");
                return Long.parseLong(parts[2]);
            }).collect(Collectors.toSet());
        } catch (Exception e) {
            System.err.println("Redis is offline. getLockedSeats returning empty: " + e.getMessage());
            return new HashSet<>();
        }
    }
}
