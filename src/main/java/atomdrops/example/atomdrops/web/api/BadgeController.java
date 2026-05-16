package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.service.BadgeService;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/badges")
public class BadgeController {

    private final BadgeService badgeService;

    public BadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getBadges(@PathVariable Long userId) {
        return ResponseEntity.ok(badgeService.getBadgesForUser(userId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Map<String, Object>>> getMyBadges(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(badgeService.getBadgesForUser(userId));
    }
}
