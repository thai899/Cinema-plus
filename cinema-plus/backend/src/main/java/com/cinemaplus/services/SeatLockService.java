package com.cinemaplus.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SeatLockService — Distributed Locking ghế tạm thời bằng Redis.
 *
 * <p>Redis key format: {@code lock:showtime:{showtimeId}:seat:{seatId}}
 * <p>Giá trị: {@code userId} (String)
 * <p>TTL: cấu hình qua {@code seat.lock.ttl-seconds} (mặc định 300 giây / 5 phút)
 *
 * <p>Luồng hoạt động:
 * <ol>
 *   <li>Khách chọn ghế → {@link #tryLock} → Redis SET NX EX</li>
 *   <li>Trước thanh toán → {@link #isLockedByUser} xác nhận vẫn còn lock</li>
 *   <li>Thanh toán thành công → {@link #unlock} xóa key → lưu DB SQL Server</li>
 *   <li>Hết 5 phút không thanh toán → Redis tự TTL expire → ghế tự do</li>
 * </ol>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final StringRedisTemplate redisTemplate;

    /** TTL lấy từ application.yml: seat.lock.ttl-seconds (default 300 s = 5 phút) */
    @Value("${seat.lock.ttl-seconds:300}")
    private long lockTtlSeconds;

    // ── Key builder ────────────────────────────────────────────────────────────

    /**
     * Tạo Redis key theo format chuẩn:
     * {@code lock:showtime:{showtimeId}:seat:{seatId}}
     */
    private String buildKey(Long showtimeId, Long seatId) {
        return String.format("lock:showtime:%d:seat:%d", showtimeId, seatId);
    }

    /** Pattern dùng để scan tất cả ghế của một suất chiếu. */
    private String buildPattern(Long showtimeId) {
        return String.format("lock:showtime:%d:seat:*", showtimeId);
    }

    // ── Core locking API ───────────────────────────────────────────────────────

    /**
     * Khóa ghế cho userId (atomic SET NX EX).
     *
     * @return {@code true} nếu lock thành công (ghế chưa ai giữ),
     *         {@code false} nếu ghế đã bị người khác khóa.
     */
    public boolean tryLock(Long showtimeId, Long seatId, String userId) {
        try {
            String key   = buildKey(showtimeId, seatId);
            Boolean held = redisTemplate.opsForValue()
                    .setIfAbsent(key, userId, Duration.ofSeconds(lockTtlSeconds));
            boolean success = Boolean.TRUE.equals(held);

            if (success) {
                log.info("[SeatLock] LOCKED   key={} userId={} ttl={}s", key, userId, lockTtlSeconds);
            } else {
                String holder = redisTemplate.opsForValue().get(key);
                log.warn("[SeatLock] CONFLICT key={} heldBy={} requestedBy={}", key, holder, userId);
            }
            return success;
        } catch (Exception ex) {
            // Redis offline → fail-open (cho phép tiếp tục để không block UX)
            log.error("[SeatLock] Redis unavailable – fail-open for showtimeId={} seatId={}: {}",
                    showtimeId, seatId, ex.getMessage());
            return true;
        }
    }

    /**
     * Giải phóng ghế — chỉ xóa nếu đúng userId đang giữ (chống xóa nhầm lock người khác).
     *
     * @return {@code true} nếu unlock thành công, {@code false} nếu key không thuộc userId.
     */
    public boolean unlock(Long showtimeId, Long seatId, String userId) {
        try {
            String key    = buildKey(showtimeId, seatId);
            String holder = redisTemplate.opsForValue().get(key);

            if (userId.equals(holder)) {
                redisTemplate.delete(key);
                log.info("[SeatLock] UNLOCKED key={} userId={}", key, userId);
                return true;
            }

            log.warn("[SeatLock] UNLOCK DENIED key={} requestedBy={} actualHolder={}",
                    key, userId, holder);
            return false;
        } catch (Exception ex) {
            log.error("[SeatLock] Redis unavailable on unlock key=lock:showtime:{}:seat:{}: {}",
                    showtimeId, seatId, ex.getMessage());
            return false;
        }
    }

    /**
     * Giải phóng toàn bộ ghế của userId trong một suất chiếu
     * (dùng khi user hủy / timeout / rời trang).
     */
    public int unlockAll(Long showtimeId, String userId) {
        try {
            Set<String> keys = redisTemplate.keys(buildPattern(showtimeId));
            if (keys == null || keys.isEmpty()) return 0;

            int count = 0;
            for (String key : keys) {
                String holder = redisTemplate.opsForValue().get(key);
                if (userId.equals(holder)) {
                    redisTemplate.delete(key);
                    count++;
                }
            }
            log.info("[SeatLock] UNLOCK_ALL showtimeId={} userId={} released={}", showtimeId, userId, count);
            return count;
        } catch (Exception ex) {
            log.error("[SeatLock] Redis unavailable on unlockAll: {}", ex.getMessage());
            return 0;
        }
    }

    // ── Query API ──────────────────────────────────────────────────────────────

    /**
     * Kiểm tra ghế có đang bị khóa bởi BẤT KỲ ai không.
     */
    public boolean isLocked(Long showtimeId, Long seatId) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(buildKey(showtimeId, seatId)));
        } catch (Exception ex) {
            log.error("[SeatLock] Redis unavailable on isLocked: {}", ex.getMessage());
            return false; // fail-open
        }
    }

    /**
     * Kiểm tra ghế có đang bị khóa bởi đúng userId này không.
     * Dùng trước bước thanh toán để xác nhận lock còn hiệu lực.
     */
    public boolean isLockedByUser(Long showtimeId, Long seatId, String userId) {
        try {
            String holder = redisTemplate.opsForValue().get(buildKey(showtimeId, seatId));
            return userId.equals(holder);
        } catch (Exception ex) {
            log.error("[SeatLock] Redis unavailable on isLockedByUser: {}", ex.getMessage());
            return false;
        }
    }

    /**
     * Lấy userId đang giữ lock của ghế (null nếu không bị khóa / Redis offline).
     */
    public String getLockHolder(Long showtimeId, Long seatId) {
        try {
            return redisTemplate.opsForValue().get(buildKey(showtimeId, seatId));
        } catch (Exception ex) {
            log.error("[SeatLock] Redis unavailable on getLockHolder: {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Lấy TTL còn lại (giây) của lock ghế.
     * Trả về -1 nếu key không tồn tại hoặc không có TTL.
     */
    public long getRemainingTtl(Long showtimeId, Long seatId) {
        try {
            Long ttl = redisTemplate.getExpire(buildKey(showtimeId, seatId));
            return ttl != null ? ttl : -1L;
        } catch (Exception ex) {
            log.error("[SeatLock] Redis unavailable on getRemainingTtl: {}", ex.getMessage());
            return -1L;
        }
    }

    /**
     * Lấy tập seatId đang bị khóa trong một suất chiếu.
     */
    public Set<Long> getLockedSeatIds(Long showtimeId) {
        try {
            Set<String> keys = redisTemplate.keys(buildPattern(showtimeId));
            if (keys == null) return Collections.emptySet();

            return keys.stream()
                    .map(k -> Long.parseLong(k.split(":")[4]))   // key[4] = seatId
                    .collect(Collectors.toSet());
        } catch (Exception ex) {
            log.error("[SeatLock] Redis unavailable on getLockedSeatIds: {}", ex.getMessage());
            return Collections.emptySet();
        }
    }

    // ── Legacy aliases (backward compat với code cũ) ───────────────────────────

    /** @deprecated Dùng {@link #tryLock} thay thế */
    @Deprecated
    public boolean lockSeat(Long showtimeId, Long seatId, String username) {
        return tryLock(showtimeId, seatId, username);
    }

    /** @deprecated Dùng {@link #unlock} thay thế */
    @Deprecated
    public void unlockSeat(Long showtimeId, Long seatId, String username) {
        unlock(showtimeId, seatId, username);
    }

    /** @deprecated Dùng {@link #unlockAll} thay thế */
    @Deprecated
    public void unlockAllSeatsForUser(Long showtimeId, String username) {
        unlockAll(showtimeId, username);
    }

    /** @deprecated Dùng {@link #isLocked} thay thế */
    @Deprecated
    public boolean isSeatLocked(Long showtimeId, Long seatId) {
        return isLocked(showtimeId, seatId);
    }

    /** @deprecated Dùng {@link #getLockHolder} thay thế */
    @Deprecated
    public String getSeatLockUser(Long showtimeId, Long seatId) {
        return getLockHolder(showtimeId, seatId);
    }

    /** @deprecated Dùng {@link #getLockedSeatIds} thay thế */
    @Deprecated
    public Set<Long> getLockedSeats(Long showtimeId) {
        return getLockedSeatIds(showtimeId);
    }
}
