package com.cinemaplus.controllers;

import com.cinemaplus.services.SeatLockService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * SeatLockController — REST API cho cơ chế Distributed Locking ghế tạm thời.
 *
 * <p>Base path: {@code /api/customer/seats}
 *
 * <table border="1">
 *   <tr><th>Method</th><th>Endpoint</th><th>Mô tả</th></tr>
 *   <tr><td>POST</td><td>/lock</td><td>Khóa một hoặc nhiều ghế</td></tr>
 *   <tr><td>POST</td><td>/unlock</td><td>Giải phóng ghế (thủ công / hủy)</td></tr>
 *   <tr><td>POST</td><td>/unlock-all</td><td>Giải phóng toàn bộ ghế của user trong suất</td></tr>
 *   <tr><td>GET</td><td>/status</td><td>Kiểm tra trạng thái một ghế</td></tr>
 *   <tr><td>GET</td><td>/locked</td><td>Lấy danh sách seatId đang bị khóa</td></tr>
 *   <tr><td>POST</td><td>/verify-before-payment</td><td>Xác nhận lock còn hiệu lực trước thanh toán</td></tr>
 * </table>
 */
@Slf4j
@RestController
@RequestMapping("/api/customer/seats")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class SeatLockController {

    private final SeatLockService seatLockService;

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/customer/seats/lock
    // Khóa một hoặc nhiều ghế cho suất chiếu.
    // userId lấy từ JWT (Authentication), không nhận từ body.
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Request body:
     * <pre>{@code
     * {
     *   "showtimeId": 10,
     *   "seatIds": [101, 102, 103]
     * }
     * }</pre>
     *
     * Response (200):
     * <pre>{@code
     * {
     *   "showtimeId": 10,
     *   "userId": "john_doe",
     *   "ttlSeconds": 300,
     *   "results": [
     *     { "seatId": 101, "locked": true  },
     *     { "seatId": 102, "locked": false, "reason": "Ghế đã bị người khác giữ" },
     *     { "seatId": 103, "locked": true  }
     *   ],
     *   "allLocked": false
     * }
     * }</pre>
     */
    @PostMapping("/lock")
    public ResponseEntity<?> lockSeats(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        String userId     = authentication.getName();
        Long showtimeId   = toLong(body.get("showtimeId"));
        List<?> seatIdsRaw = (List<?>) body.get("seatIds");

        if (showtimeId == null || seatIdsRaw == null || seatIdsRaw.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "showtimeId và seatIds không được để trống."));
        }

        boolean allLocked = true;
        var results = new java.util.ArrayList<Map<String, Object>>();

        for (Object raw : seatIdsRaw) {
            Long seatId = toLong(raw);
            boolean locked = seatLockService.tryLock(showtimeId, seatId, userId);
            allLocked = allLocked && locked;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("seatId", seatId);
            entry.put("locked", locked);
            if (!locked) {
                entry.put("reason", "Ghế đã bị người khác giữ. Vui lòng chọn ghế khác.");
            }
            results.add(entry);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("showtimeId", showtimeId);
        response.put("userId",     userId);
        response.put("ttlSeconds", 300);
        response.put("results",    results);
        response.put("allLocked",  allLocked);

        HttpStatus status = allLocked ? HttpStatus.OK : HttpStatus.CONFLICT;
        return ResponseEntity.status(status).body(response);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/customer/seats/unlock
    // Giải phóng một ghế cụ thể (khi user bỏ chọn thủ công).
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Request body:
     * <pre>{@code { "showtimeId": 10, "seatId": 101 } }</pre>
     */
    @PostMapping("/unlock")
    public ResponseEntity<?> unlockSeat(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        String userId   = authentication.getName();
        Long showtimeId = toLong(body.get("showtimeId"));
        Long seatId     = toLong(body.get("seatId"));

        if (showtimeId == null || seatId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "showtimeId và seatId không được để trống."));
        }

        boolean released = seatLockService.unlock(showtimeId, seatId, userId);
        return ResponseEntity.ok(Map.of(
                "showtimeId", showtimeId,
                "seatId",     seatId,
                "released",   released,
                "message",    released
                        ? "Ghế đã được giải phóng thành công."
                        : "Không thể giải phóng: ghế không thuộc quyền giữ của bạn hoặc đã hết hạn."
        ));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/customer/seats/unlock-all
    // Giải phóng toàn bộ ghế của user trong suất chiếu (hủy / rời trang).
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Request body:
     * <pre>{@code { "showtimeId": 10 } }</pre>
     */
    @PostMapping("/unlock-all")
    public ResponseEntity<?> unlockAllSeats(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        String userId   = authentication.getName();
        Long showtimeId = toLong(body.get("showtimeId"));

        if (showtimeId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "showtimeId không được để trống."));
        }

        int released = seatLockService.unlockAll(showtimeId, userId);
        return ResponseEntity.ok(Map.of(
                "showtimeId",    showtimeId,
                "userId",        userId,
                "releasedCount", released,
                "message",       released + " ghế đã được giải phóng."
        ));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/customer/seats/status?showtimeId=10&seatId=101
    // Kiểm tra trạng thái khóa của một ghế cụ thể.
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Response:
     * <pre>{@code
     * {
     *   "showtimeId": 10,
     *   "seatId": 101,
     *   "locked": true,
     *   "lockedByCurrentUser": false,
     *   "remainingTtlSeconds": 212
     * }
     * }</pre>
     */
    @GetMapping("/status")
    public ResponseEntity<?> getSeatStatus(
            @RequestParam Long showtimeId,
            @RequestParam Long seatId,
            Authentication authentication) {

        String userId     = authentication.getName();
        boolean locked    = seatLockService.isLocked(showtimeId, seatId);
        boolean mine      = seatLockService.isLockedByUser(showtimeId, seatId, userId);
        long    remaining = seatLockService.getRemainingTtl(showtimeId, seatId);

        return ResponseEntity.ok(Map.of(
                "showtimeId",          showtimeId,
                "seatId",              seatId,
                "locked",              locked,
                "lockedByCurrentUser", mine,
                "remainingTtlSeconds", remaining
        ));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/customer/seats/locked?showtimeId=10
    // Lấy danh sách seatId đang bị khóa trong suất chiếu (để render UI).
    // ══════════════════════════════════════════════════════════════════════════

    @GetMapping("/locked")
    public ResponseEntity<?> getLockedSeats(@RequestParam Long showtimeId) {
        Set<Long> lockedIds = seatLockService.getLockedSeatIds(showtimeId);
        return ResponseEntity.ok(Map.of(
                "showtimeId", showtimeId,
                "lockedSeatIds", lockedIds,
                "count", lockedIds.size()
        ));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/customer/seats/verify-before-payment
    // Xác nhận tất cả ghế vẫn còn lock trước khi chuyển sang cổng thanh toán.
    // Nếu bất kỳ ghế nào đã expire (5 phút) → trả về 409 Conflict.
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Request body:
     * <pre>{@code { "showtimeId": 10, "seatIds": [101, 102] } }</pre>
     *
     * Response (200 – OK to pay):
     * <pre>{@code { "verified": true, "message": "Tất cả ghế vẫn còn hiệu lực. Tiến hành thanh toán." } }</pre>
     *
     * Response (409 – Lock expired):
     * <pre>{@code
     * {
     *   "verified": false,
     *   "expiredSeats": [102],
     *   "message": "Một số ghế đã hết thời gian giữ chỗ. Vui lòng chọn lại."
     * }
     * }</pre>
     */
    @PostMapping("/verify-before-payment")
    public ResponseEntity<?> verifyBeforePayment(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        String userId     = authentication.getName();
        Long showtimeId   = toLong(body.get("showtimeId"));
        List<?> seatIdsRaw = (List<?>) body.get("seatIds");

        if (showtimeId == null || seatIdsRaw == null || seatIdsRaw.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "showtimeId và seatIds không được để trống."));
        }

        var expiredSeats = new java.util.ArrayList<Long>();
        for (Object raw : seatIdsRaw) {
            Long seatId = toLong(raw);
            if (!seatLockService.isLockedByUser(showtimeId, seatId, userId)) {
                expiredSeats.add(seatId);
            }
        }

        if (!expiredSeats.isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "verified",     false,
                    "expiredSeats", expiredSeats,
                    "message",      "Một số ghế đã hết thời gian giữ chỗ (5 phút). Vui lòng chọn lại."
            ));
        }

        return ResponseEntity.ok(Map.of(
                "verified", true,
                "message",  "Tất cả ghế vẫn còn hiệu lực. Tiến hành thanh toán."
        ));
    }

    // ── Helper ─────────────────────────────────────────────────────────────────

    private Long toLong(Object value) {
        if (value == null) return null;
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}