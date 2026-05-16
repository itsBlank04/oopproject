package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.service.AnalyticsService;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/vendor")
    public ResponseEntity<Map<String, Object>> getVendorAnalytics(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(analyticsService.getVendorAnalytics(userId));
    }

    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getAdminAnalytics(HttpSession session) {
        String role = (String) session.getAttribute("role");
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(analyticsService.getAdminAnalytics());
    }

    @GetMapping("/auction/{auctionId}")
    public ResponseEntity<Map<String, Object>> getAuctionAnalytics(@PathVariable Long auctionId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(analyticsService.getAuctionAnalytics(auctionId));
    }

    @GetMapping("/technician")
    public ResponseEntity<Map<String, Object>> getTechnicianAnalytics(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(analyticsService.getTechnicianAnalytics(userId));
    }

    @GetMapping("/admin/revenue-trend")
    public ResponseEntity<?> getAdminRevenueTrend(HttpSession session) {
        String role = (String) session.getAttribute("role");
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(analyticsService.getAdminRevenueTrend());
    }

    @GetMapping("/admin/user-growth")
    public ResponseEntity<?> getUserGrowth(HttpSession session) {
        String role = (String) session.getAttribute("role");
        if (!"ADMIN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(analyticsService.getUserGrowth());
    }
}
