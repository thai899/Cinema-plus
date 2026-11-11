package com.cinemaplus.controllers;

import com.cinemaplus.dtos.MovieReviewDTO;
import com.cinemaplus.dtos.requests.ReviewRequest;
import com.cinemaplus.repositories.UserRepository;
import com.cinemaplus.services.MovieReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * MovieReviewController — REST API cho module Movie Reviews & Ratings.
 *
 * <p>Base path: {@code /api/reviews}
 *
 * <table border="1">
 *   <tr><th>Method</th><th>Endpoint</th><th>Auth</th><th>Mô tả</th></tr>
 *   <tr><td>GET</td>  <td>/movies/{movieId}</td>         <td>Public</td>      <td>Danh sách review (phân trang, lọc, tìm kiếm)</td></tr>
 *   <tr><td>GET</td>  <td>/movies/{movieId}/stats</td>   <td>Public</td>      <td>Thống kê rating trung bình + phân phối</td></tr>
 *   <tr><td>POST</td> <td>/</td>                         <td>CUSTOMER</td>    <td>Tạo review mới</td></tr>
 *   <tr><td>PUT</td>  <td>/{reviewId}</td>               <td>CUSTOMER</td>    <td>Cập nhật review của chính user</td></tr>
 *   <tr><td>DELETE</td><td>/{reviewId}</td>              <td>CUSTOMER</td>    <td>Xóa review (soft delete)</td></tr>
 *   <tr><td>POST</td> <td>/{reviewId}/like</td>          <td>Authenticated</td><td>Toggle like/unlike</td></tr>
 *   <tr><td>GET</td>  <td>/my-reviews</td>               <td>Authenticated</td><td>Review của tôi (trang cá nhân)</td></tr>
 * </table>
 */
@Slf4j
@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class MovieReviewController {

    private final MovieReviewService reviewService;
    private final UserRepository     userRepository;

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/reviews/movies/{movieId}
    // Public — lấy danh sách review có phân trang, lọc rating, tìm kiếm keyword
    //
    // Query params:
    //   page     (default 0)
    //   size     (default 10)
    //   rating   (optional, 1–5)
    //   keyword  (optional)
    // ══════════════════════════════════════════════════════════════════════════
    @GetMapping("/movies/{movieId}")
    public ResponseEntity<Page<MovieReviewDTO>> getReviews(
            @PathVariable Long movieId,
            @RequestParam(defaultValue = "0")  int     page,
            @RequestParam(defaultValue = "10") int     size,
            @RequestParam(required = false)    Integer rating,
            @RequestParam(required = false)    String  keyword,
            Authentication authentication) {

        // Lấy userId của người đang xem (nếu có) để đánh dấu likedByCurrentUser
        Long currentUserId = resolveUserId(authentication);

        Page<MovieReviewDTO> result = reviewService.getReviews(
                movieId, rating, keyword, page, size, currentUserId);

        return ResponseEntity.ok(result);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/reviews/movies/{movieId}/stats
    // Public — thống kê rating (avg, distribution)
    // ══════════════════════════════════════════════════════════════════════════
    @GetMapping("/movies/{movieId}/stats")
    public ResponseEntity<Map<String, Object>> getRatingStats(@PathVariable Long movieId) {
        return ResponseEntity.ok(reviewService.getMovieRatingStats(movieId));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/reviews
    // CUSTOMER — tạo review mới
    // ══════════════════════════════════════════════════════════════════════════
    @PostMapping
    public ResponseEntity<MovieReviewDTO> createReview(
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        MovieReviewDTO created = reviewService.createReview(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PUT /api/reviews/{reviewId}
    // CUSTOMER — cập nhật review (chỉ chính user, service kiểm tra ownership)
    // ══════════════════════════════════════════════════════════════════════════
    @PutMapping("/{reviewId}")
    public ResponseEntity<MovieReviewDTO> updateReview(
            @PathVariable String reviewId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {

        // movieId trong request không được thay đổi khi update → chỉ cần rating + comment
        MovieReviewDTO updated = reviewService.updateReview(reviewId, request, authentication.getName());
        return ResponseEntity.ok(updated);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DELETE /api/reviews/{reviewId}
    // CUSTOMER — xóa review (soft delete, service kiểm tra ownership)
    // ══════════════════════════════════════════════════════════════════════════
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Map<String, String>> deleteReview(
            @PathVariable String reviewId,
            Authentication authentication) {

        reviewService.deleteReview(reviewId, authentication.getName());
        return ResponseEntity.ok(Map.of(
                "message",  "Đánh giá đã được xóa thành công.",
                "reviewId", reviewId
        ));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // POST /api/reviews/{reviewId}/like
    // Authenticated — toggle like/unlike review
    // ══════════════════════════════════════════════════════════════════════════
    @PostMapping("/{reviewId}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable String reviewId,
            Authentication authentication) {

        return ResponseEntity.ok(reviewService.toggleLike(reviewId, authentication.getName()));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GET /api/reviews/my-reviews
    // Authenticated — danh sách review của user trên trang cá nhân
    // ══════════════════════════════════════════════════════════════════════════
    @GetMapping("/my-reviews")
    public ResponseEntity<Page<MovieReviewDTO>> getMyReviews(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        return ResponseEntity.ok(
                reviewService.getMyReviews(authentication.getName(), page, size));
    }

    // ── Helper: resolve userId từ Authentication ───────────────────────────────
    private Long resolveUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        try {
            return userRepository.findByUsername(authentication.getName())
                    .map(u -> u.getId())
                    .orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}

