package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.BidderRestriction;
import atomdrops.example.atomdrops.service.BidderRestrictionService;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vendor/bidders")
public class BidderRestrictionController {

    private final BidderRestrictionService bidderRestrictionService;

    public BidderRestrictionController(BidderRestrictionService bidderRestrictionService) {
        this.bidderRestrictionService = bidderRestrictionService;
    }

    @GetMapping("/restrictions")
    public ResponseEntity<List<BidderRestriction>> getRestrictions(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(bidderRestrictionService.getRestrictions(userId));
    }

    @PostMapping("/restrict")
    public ResponseEntity<?> restrictBidder(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Long bidderId = body.get("bidderId") != null ? ((Number) body.get("bidderId")).longValue() : null;
        String reason = (String) body.get("reason");
        if (bidderId == null) return ResponseEntity.badRequest().build();
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(bidderRestrictionService.restrictBidder(userId, bidderId, reason));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/restrictions/{bidderId}")
    public ResponseEntity<Void> unrestrictBidder(@PathVariable Long bidderId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            bidderRestrictionService.unrestrictBidder(userId, bidderId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
