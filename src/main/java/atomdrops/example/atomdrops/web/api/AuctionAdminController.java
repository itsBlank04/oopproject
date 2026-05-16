package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.Auction;
import atomdrops.example.atomdrops.model.enums.AuctionStatus;
import atomdrops.example.atomdrops.repository.AuctionRepository;
import atomdrops.example.atomdrops.service.AuctionService;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/auctions")
public class AuctionAdminController {

    private final AuctionRepository auctionRepository;
    private final AuctionService auctionService;

    public AuctionAdminController(AuctionRepository auctionRepository, AuctionService auctionService) {
        this.auctionRepository = auctionRepository;
        this.auctionService = auctionService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<PendingAuctionResponse>> getPending(HttpSession session) {
        if (session.getAttribute("userId") == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        List<PendingAuctionResponse> items = auctionRepository.findByStatus(AuctionStatus.CREATED).stream()
            .map(a -> new PendingAuctionResponse(
                a.getId(), a.getTitle(), a.getVendor().getDisplayName(),
                a.getType().name(), a.getStartTime(), a.getEndTime()))
            .toList();
        return ResponseEntity.ok(items);
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Void> approve(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        auctionService.approveAuction(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        auctionService.rejectAuction(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<Void> activate(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            auctionService.activateAuction(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<Void> close(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            auctionService.closeAuction(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Void> complete(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        try {
            auctionService.completeAuction(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAll(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        List<Auction> all = auctionRepository.findAll();
        var items = all.stream().map(a -> new AdminAuctionResponse(
            a.getId(), a.getTitle(),
            a.getVendor() != null ? a.getVendor().getDisplayName() : "N/A",
            a.getType().name(), a.getStatus().name(),
            a.getStartTime(), a.getEndTime())).toList();
        return ResponseEntity.ok(items);
    }

    private boolean isAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute("role"));
    }

    record PendingAuctionResponse(Long id, String title, String vendorName, String type,
                                  java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {}

    record AdminAuctionResponse(Long id, String title, String vendorName, String type, String status,
                                java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {}
}
