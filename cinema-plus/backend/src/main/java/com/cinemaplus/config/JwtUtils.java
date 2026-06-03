package com.cinemaplus.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Component
public class JwtUtils {

    @Autowired
    private JwtProperties jwtProperties;

    /**
     * Tạo token JWT cho một user kèm theo phân quyền của họ.
     */
    public String generateToken(String username, String role) {
        try {
            // 1. Header JSON mã hóa Base64URL
            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            String header = Base64.getUrlEncoder().withoutPadding().encodeToString(
                headerJson.getBytes(StandardCharsets.UTF_8)
            );
            
            // 2. Payload JSON kèm thời điểm khởi tạo và hết hạn
            long now = System.currentTimeMillis();
            long expiry = now + jwtProperties.getJwtExpirationMs();
            
            String payloadJson = String.format(
                "{\"sub\":\"%s\",\"role\":\"%s\",\"iat\":%d,\"exp\":%d}",
                username, role, now / 1000, expiry / 1000
            );
            String payload = Base64.getUrlEncoder().withoutPadding().encodeToString(
                payloadJson.getBytes(StandardCharsets.UTF_8)
            );
            
            // 3. Ký mã xác minh bằng HMAC-SHA256
            String signature = sign(header + "." + payload, jwtProperties.getJwtSecret());
            
            return header + "." + payload + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi sinh JWT token", e);
        }
    }

    /**
     * Xác thực tính toàn vẹn và hạn dùng của token JWT.
     */
    public boolean validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }
            
            String header = parts[0];
            String payload = parts[1];
            String signature = parts[2];
            
            // So khớp chữ ký số để chống sửa đổi dữ liệu payload
            String expectedSignature = sign(header + "." + payload, jwtProperties.getJwtSecret());
            if (!expectedSignature.equals(signature)) {
                return false;
            }
            
            // Kiểm tra xem token đã hết hạn hay chưa
            String payloadJson = new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
            long exp = Long.parseLong(payloadJson.split("\"exp\":")[1].split("}")[0].split(",")[0].trim());
            
            return exp * 1000 > System.currentTimeMillis();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Lấy username từ token JWT.
     */
    public String getUsernameFromToken(String token) {
        try {
            String payload = token.split("\\.")[1];
            String payloadJson = new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
            return payloadJson.split("\"sub\":\"")[1].split("\"")[0];
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Lấy role từ token JWT.
     */
    public String getRoleFromToken(String token) {
        try {
            String payload = token.split("\\.")[1];
            String payloadJson = new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
            return payloadJson.split("\"role\":\"")[1].split("\"")[0];
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Ký chữ ký HMAC-SHA256.
     */
    private String sign(String data, String secret) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] hash = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    }
}
