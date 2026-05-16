package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.service.RepairService;
import atomdrops.example.atomdrops.web.dto.RepairBookingRequest;
import atomdrops.example.atomdrops.web.dto.RepairBookingResponse;
import atomdrops.example.atomdrops.web.dto.RepairQuoteRequest;
import atomdrops.example.atomdrops.web.dto.RepairQuoteResponse;
import atomdrops.example.atomdrops.web.dto.RepairRequestRequest;
import atomdrops.example.atomdrops.web.dto.RepairRequestResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/repairs")
public class RepairController {

    private final RepairService repairService;

    public RepairController(RepairService repairService) {
        this.repairService = repairService;
    }

    @GetMapping("/requests")
    public ResponseEntity<List<RepairRequestResponse>> getMyRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(repairService.getRequestsForCustomer(userId));
    }

    @GetMapping("/requests/open")
    public ResponseEntity<List<RepairRequestResponse>> getOpenRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String role = (String) session.getAttribute("role");
        if (!"TECHNICIAN".equals(role)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(repairService.getOpenRequests());
    }

    @PostMapping("/requests")
    public ResponseEntity<RepairRequestResponse> createRequest(@Valid @RequestBody RepairRequestRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(repairService.createRequest(userId, request));
    }

    @PostMapping("/requests/{id}/quotes")
    public ResponseEntity<RepairQuoteResponse> createQuote(@PathVariable Long id, @Valid @RequestBody RepairQuoteRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(repairService.createQuote(userId, id, request));
    }

    @GetMapping("/requests/{id}/quotes")
    public ResponseEntity<List<RepairQuoteResponse>> getQuotes(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(repairService.getQuotesForRequest(id));
    }

    @PostMapping("/bookings")
    public ResponseEntity<RepairBookingResponse> acceptQuote(@Valid @RequestBody RepairBookingRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(repairService.acceptQuote(userId, request));
    }

    @GetMapping("/technician/bookings")
    public ResponseEntity<List<RepairBookingResponse>> getBookingsForTechnician(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(repairService.getBookingsForTechnician(userId));
    }

    @PostMapping("/bookings/{id}/reject")
    public ResponseEntity<Void> rejectBooking(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        repairService.rejectBooking(id, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/bookings/{id}/complete")
    public ResponseEntity<Void> completeBooking(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        repairService.completeBooking(id, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reviews")
    public ResponseEntity<Void> submitReview(
            @RequestBody Map<String, Object> body,
            HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        Object revieweeObj = body.get("revieweeId");
        Object ratingObj = body.get("rating");
        if (revieweeObj == null || ratingObj == null) {
            return ResponseEntity.badRequest().build();
        }
        Long revieweeId;
        int rating;
        try {
            revieweeId = Long.valueOf(revieweeObj.toString());
            rating = Integer.parseInt(ratingObj.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }
        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().build();
        }
        String comment = body.get("comment") != null ? body.get("comment").toString() : null;
        repairService.submitReview(userId, revieweeId, rating, comment);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
