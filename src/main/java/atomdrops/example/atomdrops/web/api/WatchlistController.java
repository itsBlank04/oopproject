package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.AuctionLot;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.Watchlist;
import atomdrops.example.atomdrops.repository.AuctionLotRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import atomdrops.example.atomdrops.repository.WatchlistRepository;
import jakarta.servlet.http.HttpSession;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/watchlist")
public class WatchlistController {

    private final WatchlistRepository watchlistRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final UserRepository userRepository;

    public WatchlistController(
            WatchlistRepository watchlistRepository,
            AuctionLotRepository auctionLotRepository,
            UserRepository userRepository) {
        this.watchlistRepository = watchlistRepository;
        this.auctionLotRepository = auctionLotRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<WatchlistResponse>> getMyWatchlist(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        List<WatchlistResponse> items = watchlistRepository.findByUser_Id(userId).stream()
            .map(w -> new WatchlistResponse(w.getId(), w.getLot().getId(), w.getCreatedAt()))
            .toList();
        return ResponseEntity.ok(items);
    }

    @Transactional
    @PostMapping
    public ResponseEntity<WatchlistResponse> add(@RequestParam Long lotId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (watchlistRepository.findByUser_IdAndLot_Id(userId, lotId).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        AuctionLot lot = auctionLotRepository.findById(lotId)
            .orElseThrow(() -> new IllegalArgumentException("Lot not found: " + lotId));

        Watchlist w = new Watchlist();
        w.setUser(user);
        w.setLot(lot);
        w = watchlistRepository.save(w);

        return ResponseEntity.status(HttpStatus.CREATED).body(new WatchlistResponse(w.getId(), w.getLot().getId(), w.getCreatedAt()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        Watchlist w = watchlistRepository.findById(id).orElse(null);
        if (w == null) return ResponseEntity.notFound().build();
        if (!w.getUser().getId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        watchlistRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    record WatchlistResponse(Long id, Long lotId, Instant createdAt) {}
}
