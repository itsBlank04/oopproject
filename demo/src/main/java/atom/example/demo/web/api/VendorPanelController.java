package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Auction;
import atom.example.demo.model.OrderItem;
import atom.example.demo.model.Product;
import atom.example.demo.model.VendorCommission;
import atom.example.demo.model.VendorProfile;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.OrderItemRepository;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorCommissionRepository;
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
    private final ProductRepository productRepository;
    private final VendorCommissionRepository vendorCommissionRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;

    public VendorPanelController(VendorProfileRepository vendorProfileRepository,
            AuctionRepository auctionRepository, ProductRepository productRepository,
            VendorCommissionRepository vendorCommissionRepository,
            OrderItemRepository orderItemRepository, UserRepository userRepository) {
        this.vendorProfileRepository = vendorProfileRepository;
        this.auctionRepository = auctionRepository;
        this.productRepository = productRepository;
        this.vendorCommissionRepository = vendorCommissionRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        VendorProfile profile = vendorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        List<Auction> auctions = auctionRepository.findByVendorId(userId);
        long activeAuctions = auctions.stream().filter(a -> "ACTIVE".equals(a.getStatus())).count();
        long pendingAuctions = auctions.stream().filter(a -> "CREATED".equals(a.getStatus())).count();
        List<VendorCommission> commissions = vendorCommissionRepository.findByVendorId(userId);
        long totalOrders = commissions.size();
        long pendingCommissions = commissions.stream().filter(c -> "PENDING".equals(c.getStatus())).count();
        double totalEarned = commissions.stream().filter(c -> "PAID".equals(c.getStatus())).mapToDouble(c -> c.getNetPayoutBdt().doubleValue()).sum();
        long totalProducts = productRepository.countByVendorId(userId);
        return Map.of("vendorId", profile.getId(), "shopName", profile.getShopName(),
                "verificationStatus", profile.getVerificationStatus(),
                "totalAuctions", auctions.size(), "activeAuctions", activeAuctions,
                "pendingAuctions", pendingAuctions, "totalProducts", totalProducts,
                "totalOrders", totalOrders, "pendingCommissions", pendingCommissions,
                "totalEarned", totalEarned);
    }

    @GetMapping("/orders")
    public List<Map<String, Object>> orders(HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        vendorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        List<VendorCommission> commissions = vendorCommissionRepository.findByVendorId(userId);
        List<Map<String, Object>> result = commissions.stream().map(c -> {
            Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", c.getId());
            m.put("orderItemId", c.getOrderItem().getId());
            m.put("orderId", c.getOrderItem().getOrder().getId());
            m.put("productName", c.getOrderItem().getProduct() != null ? c.getOrderItem().getProduct().getName() : "N/A");
            m.put("qty", c.getOrderItem().getQty());
            m.put("saleAmountBdt", c.getSaleAmountBdt());
            m.put("commissionBdt", c.getCommissionBdt());
            m.put("netPayoutBdt", c.getNetPayoutBdt());
            m.put("status", c.getStatus());
            m.put("createdAt", c.getCreatedAt());
            return m;
        }).toList();
        return result;
    }

    @GetMapping("/products")
    public List<Product> products(HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        vendorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        return productRepository.findByVendorId(userId);
    }

    @GetMapping("/auctions")
    public List<Auction> auctions(HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        vendorProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        return auctionRepository.findByVendorId(userId);
    }
}
