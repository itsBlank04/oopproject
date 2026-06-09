package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.VendorSubscription;
import atom.example.demo.model.VendorSubscriptionDeal;
import atom.example.demo.model.VendorSubscriptionPlan;
import atom.example.demo.service.VendorSubscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vendor/subscription")
public class VendorSubscriptionController {

    private final VendorSubscriptionService subscriptionService;

    public VendorSubscriptionController(VendorSubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/plans")
    public ResponseEntity<List<VendorSubscriptionPlan>> getAllPlans() {
        return ResponseEntity.ok(subscriptionService.getAllPlans());
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSubscriptionSummary() {
        if (!SecurityConfig.hasRole("VENDOR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Vendor access required"));
        }
        Long vendorId = SecurityConfig.getSessionUserId();
        if (vendorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        
        // Auto-enroll in BASIC plan if no subscription exists
        subscriptionService.ensureBasicSubscription(vendorId);
        
        return ResponseEntity.ok(subscriptionService.getSubscriptionSummary(vendorId));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribeToPlan(@RequestBody Map<String, Object> body) {
        if (!SecurityConfig.hasRole("VENDOR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Vendor access required"));
        }
        Long vendorId = SecurityConfig.getSessionUserId();
        if (vendorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        if (body.get("planId") == null || body.get("billingCycle") == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "planId and billingCycle are required"));
        }

        Long planId = Long.valueOf(body.get("planId").toString());
        String billingCycle = (String) body.get("billingCycle");

        try {
            VendorSubscription sub = subscriptionService.subscribeToPlan(vendorId, planId, billingCycle);
            // enforce limits after subscription change (e.g. pause shops if downgraded)
            subscriptionService.enforceShopLimits(vendorId);
            return ResponseEntity.ok(sub);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/deals")
    public ResponseEntity<List<VendorSubscriptionDeal>> getActiveDeals() {
        return ResponseEntity.ok(subscriptionService.getActiveDeals());
    }
}
