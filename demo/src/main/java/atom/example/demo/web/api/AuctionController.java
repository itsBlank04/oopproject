package atom.example.demo.web.api;

import atom.example.demo.model.Auction;
import atom.example.demo.model.User;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;

    public AuctionController(AuctionRepository auctionRepository, UserRepository userRepository) {
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Auction> list(@RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long category) {
        if (status != null && type != null) return auctionRepository.findByStatusAndType(status, type);
        if (status != null) return auctionRepository.findByStatus(status);
        return auctionRepository.findAll();
    }

    @GetMapping("/{id}")
    public Auction getOne(@PathVariable Long id) {
        return auctionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Auction not found"));
    }

    @PostMapping
    public Auction create(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User vendor = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Auction auction = new Auction();
        auction.setVendor(vendor);
        auction.setTitle((String) body.get("title"));
        auction.setType((String) body.get("type"));
        if (body.containsKey("startTime")) auction.setStartTime(java.time.Instant.parse((String) body.get("startTime")));
        if (body.containsKey("endTime")) auction.setEndTime(java.time.Instant.parse((String) body.get("endTime")));
        if (body.containsKey("termsAccepted")) auction.setTermsAccepted(Boolean.parseBoolean(body.get("termsAccepted").toString()));
        return auctionRepository.save(auction);
    }

    @PutMapping("/{id}")
    public Auction update(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Auction auction = auctionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (!auction.getVendor().getId().equals(userId)) throw new IllegalArgumentException("Not your auction");
        if (!"CREATED".equals(auction.getStatus())) throw new IllegalArgumentException("Can only edit CREATED auctions");
        if (body.containsKey("title")) auction.setTitle((String) body.get("title"));
        if (body.containsKey("type")) auction.setType((String) body.get("type"));
        if (body.containsKey("startTime")) auction.setStartTime(java.time.Instant.parse((String) body.get("startTime")));
        if (body.containsKey("endTime")) auction.setEndTime(java.time.Instant.parse((String) body.get("endTime")));
        if (body.containsKey("termsAccepted")) auction.setTermsAccepted(Boolean.parseBoolean(body.get("termsAccepted").toString()));
        return auctionRepository.save(auction);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Auction auction = auctionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (!auction.getVendor().getId().equals(userId)) throw new IllegalArgumentException("Not your auction");
        if (!"CREATED".equals(auction.getStatus())) throw new IllegalArgumentException("Can only delete CREATED auctions");
        auctionRepository.delete(auction);
        return Map.of("message", "Deleted");
    }
}
