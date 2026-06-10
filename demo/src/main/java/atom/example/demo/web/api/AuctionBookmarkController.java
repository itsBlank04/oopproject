package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Auction;
import atom.example.demo.model.AuctionBookmark;
import atom.example.demo.model.User;
import atom.example.demo.repository.AuctionBookmarkRepository;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.transaction.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookmarks/auctions")
public class AuctionBookmarkController {

    private final AuctionBookmarkRepository bookmarkRepository;
    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;

    public AuctionBookmarkController(AuctionBookmarkRepository bookmarkRepository,
                                     AuctionRepository auctionRepository,
                                     UserRepository userRepository) {
        this.bookmarkRepository = bookmarkRepository;
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<AuctionBookmark> list(HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return bookmarkRepository.findByUserId(userId);
    }

    @GetMapping("/{auctionId}")
    public Map<String, Object> status(@PathVariable Long auctionId, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return Map.of(
            "auctionId", auctionId,
            "bookmarked", bookmarkRepository.existsByUserIdAndAuctionId(userId, auctionId),
            "bookmarkers", bookmarkRepository.countByAuctionId(auctionId)
        );
    }

    @PostMapping("/{auctionId}")
    public AuctionBookmark add(@PathVariable Long auctionId, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        var existing = bookmarkRepository.findByUserIdAndAuctionId(userId, auctionId);
        if (existing.isPresent()) return existing.get();
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Auction auction = auctionRepository.findById(auctionId).orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        AuctionBookmark entry = new AuctionBookmark();
        entry.setUser(user);
        entry.setAuction(auction);
        return bookmarkRepository.save(entry);
    }

    @DeleteMapping("/{auctionId}")
    @Transactional
    public Map<String, String> remove(@PathVariable Long auctionId, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        bookmarkRepository.deleteByUserIdAndAuctionId(userId, auctionId);
        return Map.of("message", "Removed");
    }
}
