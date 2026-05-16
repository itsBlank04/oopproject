package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.enums.AgreementType;
import atomdrops.example.atomdrops.service.AgreementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/agreements")
public class AgreementController {

    private final AgreementService agreementService;

    public AgreementController(AgreementService agreementService) {
        this.agreementService = agreementService;
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptAgreement(@RequestBody Map<String, String> body, HttpSession session, HttpServletRequest request) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String typeStr = body.get("type");
        if (typeStr == null) return ResponseEntity.badRequest().build();
        AgreementType type;
        try {
            type = AgreementType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid agreement type"));
        }
        try {
            return ResponseEntity.ok(agreementService.accept(userId, type, request.getRemoteAddr()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getAgreementStatus(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Map<String, Boolean> status = Map.of(
            "terms", agreementService.hasAccepted(userId, AgreementType.TERMS),
            "privacy", agreementService.hasAccepted(userId, AgreementType.PRIVACY),
            "auctionRules", agreementService.hasAccepted(userId, AgreementType.AUCTION_RULES)
        );
        return ResponseEntity.ok(status);
    }
}
