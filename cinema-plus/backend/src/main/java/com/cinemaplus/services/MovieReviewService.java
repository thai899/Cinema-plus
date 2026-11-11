package com.cinemaplus.services;

import com.cinemaplus.documents.MovieReview;
import com.cinemaplus.documents.UserActivityLog;
import com.cinemaplus.dtos.MovieReviewDTO;
import com.cinemaplus.dtos.requests.ReviewRequest;
import com.cinemaplus.entities.User;
import com.cinemaplus.repositories.MovieReviewRepository;
import com.cinemaplus.repositories.UserActivityLogRepository;
import com.cinemaplus.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * MovieReviewService — Business logic cho module Movie Reviews & Ratings.
 *
 * <p>Tích hợp với:
 * <ul>
 *   <li>MongoDB (reviews, activity logs)</li>
 *   <li>SQL Server (lấy thông tin User từ UserRepository)</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MovieReviewService {

    private final MovieReviewRepository    reviewRepo;
    private final UserActivityLogRepository activityRepo;
    private final UserRepository           userRepository;
    private final MongoTemplate            mongoTemplate;

    private static final String STATUS_ACTIVE = "ACTIVE";

    // ══════════════════════════════════════════════════════════════════════════
    // CREATE — Thêm mới bình luận
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Tạo review mới cho phim.
     * Mỗi user chỉ được review một phim một lần (đảm bảo bằng unique index MongoDB).
     */
    public MovieReviewDTO createReview(ReviewRequest request, String username) {
        User user = getUser(username);

        // Kiểm tra đã review chưa
        if (reviewRepo.existsByMovieIdAndUserId(request.getMovieId(), user.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Bạn đã đánh giá bộ phim này rồi. Vui lòng chỉnh sửa đánh giá cũ.");
        }

        MovieReview review = MovieReview.builder()
                .movieId(request.getMovieId())
                .userId(user.getId())
                .username(user.getUsername())
                .rating(request.getRating())
                .comment(request.getComment())
                .images(request.getImages())
                .createdAt(LocalDateTime.now())
                .likesCount(0)
                .likedBy(new ArrayList<>())
                .status(STATUS_ACTIVE)
                .build();

        MovieReview saved = reviewRepo.save(review);
        log.info("[Review] CREATED reviewId={} movieId={} userId={}", saved.getId(), saved.getMovieId(), user.getId());

        // Ghi activity log
        logActivity(user, "WRITE_REVIEW", saved.getId(), "REVIEW",
                Map.of("movieId", request.getMovieId(), "rating", request.getRating()));

        return toDTO(saved, user.getId());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // READ — Lấy danh sách bình luận theo movieId (phân trang)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Lấy danh sách review có phân trang và sắp xếp.
     *
     * @param movieId   ID phim (FK → SQL Server)
     * @param rating    null = lấy tất cả, 1–5 = lọc theo số sao
     * @param keyword   null/blank = không lọc, khác = tìm trong comment
     * @param page      số trang (0-indexed)
     * @param size      số phần tử mỗi trang
     * @param currentUserId userId của người đang đăng nhập (để đánh dấu likedByCurrentUser)
     */
    public Page<MovieReviewDTO> getReviews(
            Long movieId, Integer rating, String keyword,
            int page, int size, Long currentUserId) {

        // Mặc định sort: mới nhất trước
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "created_at"));

        Page<MovieReview> reviews;

        boolean hasRating  = rating != null;
        boolean hasKeyword = keyword != null && !keyword.isBlank();

        if (hasRating && hasKeyword) {
            reviews = reviewRepo.searchByRatingAndKeyword(movieId, rating, keyword, STATUS_ACTIVE, pageable);
        } else if (hasRating) {
            reviews = reviewRepo.findByMovieIdAndRatingAndStatus(movieId, rating, STATUS_ACTIVE, pageable);
        } else if (hasKeyword) {
            reviews = reviewRepo.searchByKeywordInComment(movieId, keyword, STATUS_ACTIVE, pageable);
        } else {
            reviews = reviewRepo.findByMovieIdAndStatus(movieId, STATUS_ACTIVE, pageable);
        }

        return reviews.map(r -> toDTO(r, currentUserId));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // READ — Thống kê rating của phim (điểm trung bình + phân phối)
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Trả về thống kê đánh giá của phim:
     * - averageRating
     * - totalReviews
     * - ratingDistribution: { "1": 2, "2": 5, "3": 10, "4": 25, "5": 58 }
     */
    public Map<String, Object> getMovieRatingStats(Long movieId) {
        // Aggregation pipeline: group by rating, count
        Aggregation agg = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("movie_id").is(movieId).and("status").is(STATUS_ACTIVE)),
                Aggregation.group("rating").count().as("count"),
                Aggregation.project("count").and("_id").as("rating")
        );

        AggregationResults<Map> results = mongoTemplate.aggregate(agg, "movie_reviews", Map.class);

        Map<String, Integer> distribution = new LinkedHashMap<>();
        for (int i = 1; i <= 5; i++) distribution.put(String.valueOf(i), 0);

        double totalScore = 0;
        int totalReviews  = 0;

        for (Map row : results.getMappedResults()) {
            int r     = ((Number) row.get("rating")).intValue();
            int count = ((Number) row.get("count")).intValue();
            distribution.put(String.valueOf(r), count);
            totalScore   += (double) r * count;
            totalReviews += count;
        }

        double avg = totalReviews > 0 ? Math.round((totalScore / totalReviews) * 10.0) / 10.0 : 0.0;

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("movieId",             movieId);
        stats.put("averageRating",       avg);
        stats.put("totalReviews",        totalReviews);
        stats.put("ratingDistribution",  distribution);
        return stats;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UPDATE — Cập nhật bình luận (chỉ chính user)
    // ══════════════════════════════════════════════════════════════════════════

    public MovieReviewDTO updateReview(String reviewId, ReviewRequest request, String username) {
        User user = getUser(username);
        MovieReview review = getReviewOwnedByUser(reviewId, user.getId());

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setImages(request.getImages());
        review.setUpdatedAt(LocalDateTime.now());

        MovieReview saved = reviewRepo.save(review);
        log.info("[Review] UPDATED reviewId={} userId={}", reviewId, user.getId());

        logActivity(user, "UPDATE_REVIEW", reviewId, "REVIEW",
                Map.of("movieId", review.getMovieId(), "newRating", request.getRating()));

        return toDTO(saved, user.getId());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // DELETE — Xóa bình luận (chỉ chính user, soft delete)
    // ══════════════════════════════════════════════════════════════════════════

    public void deleteReview(String reviewId, String username) {
        User user = getUser(username);
        MovieReview review = getReviewOwnedByUser(reviewId, user.getId());

        // Soft delete: đổi status thành DELETED thay vì xóa hẳn
        review.setStatus("DELETED");
        review.setUpdatedAt(LocalDateTime.now());
        reviewRepo.save(review);

        log.info("[Review] DELETED (soft) reviewId={} userId={}", reviewId, user.getId());
        logActivity(user, "DELETE_REVIEW", reviewId, "REVIEW",
                Map.of("movieId", review.getMovieId()));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LIKE — Toggle like/unlike review
    // ══════════════════════════════════════════════════════════════════════════

    public Map<String, Object> toggleLike(String reviewId, String username) {
        User user = getUser(username);
        MovieReview review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review không tồn tại."));

        List<Long> likedBy = review.getLikedBy() == null ? new ArrayList<>() : review.getLikedBy();
        boolean alreadyLiked = likedBy.contains(user.getId());

        if (alreadyLiked) {
            likedBy.remove(user.getId());
            review.setLikesCount(Math.max(0, review.getLikesCount() - 1));
        } else {
            likedBy.add(user.getId());
            review.setLikesCount(review.getLikesCount() + 1);
        }

        review.setLikedBy(likedBy);
        reviewRepo.save(review);

        return Map.of(
                "reviewId",   reviewId,
                "liked",      !alreadyLiked,
                "likesCount", review.getLikesCount()
        );
    }

    // ══════════════════════════════════════════════════════════════════════════
    // READ — Lấy review của user trên trang cá nhân
    // ══════════════════════════════════════════════════════════════════════════

    public Page<MovieReviewDTO> getMyReviews(String username, int page, int size) {
        User user = getUser(username);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "created_at"));
        return reviewRepo.findByUserIdAndStatus(user.getId(), STATUS_ACTIVE, pageable)
                .map(r -> toDTO(r, user.getId()));
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Private helpers
    // ══════════════════════════════════════════════════════════════════════════

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "User không tồn tại: " + username));
    }

    private MovieReview getReviewOwnedByUser(String reviewId, Long userId) {
        MovieReview review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review không tồn tại."));

        if (!review.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Bạn không có quyền chỉnh sửa đánh giá này.");
        }
        if ("DELETED".equals(review.getStatus())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Review này đã bị xóa.");
        }
        return review;
    }

    private MovieReviewDTO toDTO(MovieReview review, Long currentUserId) {
        boolean liked = currentUserId != null
                && review.getLikedBy() != null
                && review.getLikedBy().contains(currentUserId);

        return MovieReviewDTO.builder()
                .id(review.getId())
                .movieId(review.getMovieId())
                .userId(review.getUserId())
                .username(review.getUsername())
                .rating(review.getRating())
                .comment(review.getComment())
                .images(review.getImages())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .likesCount(review.getLikesCount())
                .likedByCurrentUser(liked)
                .status(review.getStatus())
                .build();
    }

    private void logActivity(User user, String action, String targetId,
                              String targetType, Map<String, Object> metadata) {
        try {
            UserActivityLog log = UserActivityLog.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .action(action)
                    .targetId(targetId)
                    .targetType(targetType)
                    .metadata(metadata)
                    .createdAt(LocalDateTime.now())
                    .build();
            activityRepo.save(log);
        } catch (Exception e) {
            // Log thất bại không nên block luồng chính
            log.warn("[Activity] Failed to save activity log: {}", e.getMessage());
        }
    }
}

