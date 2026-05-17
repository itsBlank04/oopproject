package atom.example.demo.web.api;

import atom.example.demo.model.Auction;
import atom.example.demo.model.VendorProfile;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorProfileRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendor")
public class VendorPanelController {

    private final VendorProfileRepository vendorProfileRepository;
    private final AuctionRepository auctionRepository;
    private final UserRepository userRepository;

    public VendorPanelController(VendorProfileRepository vendorProfileRepository,
            AuctionRepository auctionRepository, UserRepository userRepository) {
        this.vendorProfileRepository = vendorProfileRepository;
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        VendorProfile profile = vendorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        List<Auction> auctions = auctionRepository.findByVendorId(userId);
        long activeAuctions = auctions.stream().filter(a -> "ACTIVE".equals(a.getStatus())).count();
        long pendingAuctions = auctions.stream().filter(a -> "CREATED".equals(a.getStatus())).count();
        return Map.of("vendorId", profile.getId(), "shopName", profile.getShopName(),
                "verificationStatus", profile.getVerificationStatus(),
                "totalAuctions", auctions.size(), "activeAuctions", activeAuctions,
                "pendingAuctions", pendingAuctions);
    }

    @GetMapping("/orders")
    public List<Map<String, Object>> orders(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        vendorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        return List.of();
    }

    @GetMapping("/products")
    public List<?> products(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        vendorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        return List.of();
    }

    @GetMapping("/auctions")
    public List<Auction> auctions(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        vendorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        return auctionRepository.findByVendorId(userId);
    }
}
