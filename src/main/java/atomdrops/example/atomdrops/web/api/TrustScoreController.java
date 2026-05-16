package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.TrustScore;
import atomdrops.example.atomdrops.service.TrustScoreService;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trust-scores")
public class TrustScoreController {

    private final TrustScoreService trustScoreService;

    public TrustScoreController(TrustScoreService trustScoreService) {
        this.trustScoreService = trustScoreService;
    }

    @GetMapping("/me")
    public ResponseEntity<TrustScoreResponse> getMyScore(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        TrustScore ts = trustScoreService.getOrCreate(userId);
        return ResponseEntity.ok(new TrustScoreResponse(ts.getScore(), ts.getUpdatedAt()));
    }

    record TrustScoreResponse(BigDecimal score, Instant updatedAt) {}
}
