package com.cinemaplus.aspects;

import com.cinemaplus.dtos.responses.AuditLogDto;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.Arrays;

@Aspect
@Component
public class AuditLogAspect {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Pointcut lọc qua tất cả các hàm ghi/xóa dữ liệu (POST, PUT, DELETE, PATCH) thuộc gói controllers
    @Pointcut("within(com.cinemaplus.controllers..*) && (" +
            "@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.DeleteMapping) || " +
            "@annotation(org.springframework.web.bind.annotation.PatchMapping)" +
            ")")
    public void controllerWriteMethods() {}

    /**
     * Chặn sau khi hàm sửa đổi dữ liệu thực thi thành công để xuất log kiểm tra lịch sử.
     */
    @AfterReturning(pointcut = "controllerWriteMethods()", returning = "result")
    public void logAndBroadcastAdminOperations(JoinPoint joinPoint, Object result) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) {
                return;
            }
            
            HttpServletRequest request = attributes.getRequest();
            String uri = request.getRequestURI();

            // Ghi nhận log và broadcast cho tất cả namespace quan trọng
            if (uri.startsWith("/api/admin") || uri.startsWith("/api/manager")
                    || uri.startsWith("/api/staff") || uri.startsWith("/api/bookings")) {
                String username = "ANONYMOUS";
                if (SecurityContextHolder.getContext().getAuthentication() != null) {
                    username = SecurityContextHolder.getContext().getAuthentication().getName();
                }

                // Lấy địa chỉ IP của client thực hiện yêu cầu (Hỗ trợ proxy nếu chạy cloud/ngrok)
                String ipAddress = request.getHeader("X-Forwarded-For");
                if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                    ipAddress = request.getRemoteAddr();
                }

                String httpMethod = request.getMethod();
                String actionName = joinPoint.getSignature().toShortString();
                String details = "Phương thức: " + joinPoint.getSignature().getName() + " - Tham số: " + Arrays.toString(joinPoint.getArgs());

                AuditLogDto auditLog = new AuditLogDto();
                auditLog.setUsername(username);
                auditLog.setIpAddress(ipAddress);
                auditLog.setHttpMethod(httpMethod);
                auditLog.setUri(uri);
                auditLog.setActionName(actionName);
                auditLog.setTimestamp(LocalDateTime.now());
                auditLog.setDetails(details);

                // Gửi trực tiếp payload log đến topic WebSocket '/topic/logs' theo thời gian thực
                messagingTemplate.convertAndSend("/topic/logs", auditLog);
                
                System.out.println("=================================================");
                System.out.println("🔔 [AUDIT LOG AOP] Broadcasted audit log for user: " + username);
                System.out.println("   HTTP: " + httpMethod + " " + uri);
                System.out.println("   IP Client: " + ipAddress);
                System.out.println("   Action: " + actionName);
                System.out.println("=================================================");
            }
        } catch (Exception e) {
            System.err.println("❌ Lỗi xảy ra trong khâu AOP Audit Log: " + e.getMessage());
        }
    }
}
