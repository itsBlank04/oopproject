package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.ServiceListing;
import atomdrops.example.atomdrops.model.enums.ServiceStatus;
import atomdrops.example.atomdrops.service.ServiceListingService;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/service-listings")
public class ServiceListingController {

    private final ServiceListingService serviceListingService;

    public ServiceListingController(ServiceListingService serviceListingService) {
        this.serviceListingService = serviceListingService;
    }

    @GetMapping
    public ResponseEntity<List<ServiceListing>> getAll() {
        return ResponseEntity.ok(serviceListingService.findAll());
    }

    @GetMapping("/mine")
    public ResponseEntity<List<ServiceListing>> getMine(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(serviceListingService.findByTechnician(userId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String category = (String) body.get("category");
        BigDecimal priceMin = body.get("priceMinBdt") != null ? BigDecimal.valueOf(((Number) body.get("priceMinBdt")).doubleValue()) : null;
        BigDecimal priceMax = body.get("priceMaxBdt") != null ? BigDecimal.valueOf(((Number) body.get("priceMaxBdt")).doubleValue()) : null;
        String availabilityNote = (String) body.get("availabilityNote");
        if (category == null || priceMin == null || priceMax == null) return ResponseEntity.badRequest().build();
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(serviceListingService.create(userId, category, priceMin, priceMax, availabilityNote));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String category = (String) body.get("category");
        BigDecimal priceMin = body.get("priceMinBdt") != null ? BigDecimal.valueOf(((Number) body.get("priceMinBdt")).doubleValue()) : null;
        BigDecimal priceMax = body.get("priceMaxBdt") != null ? BigDecimal.valueOf(((Number) body.get("priceMaxBdt")).doubleValue()) : null;
        String availabilityNote = (String) body.get("availabilityNote");
        ServiceStatus status = body.get("status") != null ? ServiceStatus.valueOf(((String) body.get("status")).toUpperCase()) : null;
        try {
            return ResponseEntity.ok(serviceListingService.update(id, userId, category, priceMin, priceMax, availabilityNote, status));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            serviceListingService.delete(id, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
