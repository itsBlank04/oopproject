package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.FraudFlag;
import atomdrops.example.atomdrops.service.FraudDetectionService;
import jakarta.servlet.http.HttpSession;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/fraud")
public class FraudAdminController {

    private final FraudDetectionService fraudDetectionService;

    public FraudAdminController(FraudDetectionService fraudDetectionService) {
        this.fraudDetectionService = fraudDetectionService;
    }

    @GetMapping
    public ResponseEntity<List<FraudFlagResponse>> getOpenFlags(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        List<FraudFlagResponse> flags = fraudDetectionService.getOpenFlags().stream()
            .map(f -> new FraudFlagResponse(f.getId(), f.getUser().getId(), f.getUser().getDisplayName(), f.getReason(), f.getCreatedAt()))
            .toList();
        return ResponseEntity.ok(flags);
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<Void> resolve(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        fraudDetectionService.resolveFlag(id);
        return ResponseEntity.ok().build();
    }

    private boolean isAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute("role"));
    }

    record FraudFlagResponse(Long id, Long userId, String userName, String reason, Instant createdAt) {}
}
