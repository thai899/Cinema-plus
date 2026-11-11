package com.cinemaplus.dtos.requests;

import jakarta.validation.constraints.*;
import lombok.*;

import java.util.List;

/** Request body khi tạo hoặc cập nhật review. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReviewRequest {

    @NotNull(message = "movieId không được để trống")
    private Long movieId;

    @NotNull(message = "rating không được để trống")
    @Min(value = 1, message = "rating tối thiểu là 1 sao")
    @Max(value = 5, message = "rating tối đa là 5 sao")
    private Integer rating;

    @NotBlank(message = "comment không được để trống")
    @Size(min = 10, max = 2000, message = "comment phải từ 10 đến 2000 ký tự")
    private String comment;

    @Size(max = 5, message = "Chỉ được đính kèm tối đa 5 ảnh")
    private List<String> images;
}

