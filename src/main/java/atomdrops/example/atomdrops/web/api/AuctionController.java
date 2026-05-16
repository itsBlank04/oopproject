package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.service.AuctionService;
import atomdrops.example.atomdrops.web.dto.AuctionLotResponse;
import atomdrops.example.atomdrops.web.dto.AuctionResponse;
import atomdrops.example.atomdrops.web.dto.AuctionSummaryResponse;
import atomdrops.example.atomdrops.web.dto.BidResponse;
import atomdrops.example.atomdrops.web.dto.CreateAuctionRequest;
import atomdrops.example.atomdrops.web.dto.PlaceBidRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
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
@RequestMapping("/api/v1/auctions")
public class AuctionController {

    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    @GetMapping
    public ResponseEntity<List<AuctionSummaryResponse>> getAll() {
        return ResponseEntity.ok(auctionService.getAllAuctions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuctionResponse> getAuction(@PathVariable Long id) {
        return ResponseEntity.ok(auctionService.getAuction(id));
    }

    @GetMapping("/lots/{lotId}")
    public ResponseEntity<AuctionLotResponse> getLot(@PathVariable Long lotId) {
        return ResponseEntity.ok(auctionService.getLot(lotId));
    }

    @GetMapping("/lots/{lotId}/bids")
    public ResponseEntity<List<BidResponse>> getBids(@PathVariable Long lotId) {
        return ResponseEntity.ok(auctionService.getBidsForLot(lotId));
    }

    @PostMapping("/lots/{lotId}/bids")
    public ResponseEntity<BidResponse> placeBid(
        @PathVariable Long lotId,
        @Valid @RequestBody PlaceBidRequest request,
        HttpSession session
    ) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(auctionService.placeBid(lotId, userId, request.getAmountBdt()));
    }

    @PostMapping
    public ResponseEntity<AuctionResponse> create(@Valid @RequestBody CreateAuctionRequest req, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(auctionService.createAuction(userId, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AuctionResponse> update(@PathVariable Long id, @Valid @RequestBody CreateAuctionRequest req, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            return ResponseEntity.ok(auctionService.updateAuction(id, userId, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            auctionService.deleteAuction(id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
