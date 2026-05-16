package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.BidderReputation;
import atomdrops.example.atomdrops.service.BidderReputationService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bidder-reputation")
public class BidderReputationController {

    private final BidderReputationService bidderReputationService;

    public BidderReputationController(BidderReputationService bidderReputationService) {
        this.bidderReputationService = bidderReputationService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<BidderReputation> getReputation(@PathVariable Long userId, HttpSession session) {
        Long currentUserId = (Long) session.getAttribute("userId");
        if (currentUserId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(bidderReputationService.getOrCreate(userId));
    }
}
