package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Auction;
import atom.example.demo.model.Order;
import atom.example.demo.model.OrderItem;
import atom.example.demo.model.Product;
import atom.example.demo.model.User;
import atom.example.demo.model.VendorCommission;
import atom.example.demo.model.VendorProfile;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.OrderItemRepository;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorCommissionRepository;
import atom.example.demo.repository.VendorProfileRepository;
import atom.example.demo.service.OrderService;
import jakarta.servlet.http.HttpSession;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
    private final OrderService orderService;

    public VendorPanelController(VendorProfileRepository vendorProfileRepository,
            AuctionRepository auctionRepository, ProductRepository productRepository,
            VendorCommissionRepository vendorCommissionRepository,
            OrderItemRepository orderItemRepository, UserRepository userRepository,
            OrderService orderService) {
        this.vendorProfileRepository = vendorProfileRepository;
        this.auctionRepository = auctionRepository;
        this.productRepository = productRepository;
        this.vendorCommissionRepository = vendorCommissionRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        VendorProfile profile = getOrCreateProfile(userId);
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
        getOrCreateProfile(userId);
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
        return productRepository.findByVendorId(userId).stream()
            .filter(p -> p.getDeletedAt() == null)
            .toList();
    }

    @PutMapping("/products/{productId}/shipping")
    public Product updateShippingType(@PathVariable Long productId, @RequestBody Map<String, String> body) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        if (!product.getVendor().getId().equals(userId)) {
            throw new SecurityException("Not your product");
        }
        String shippingType = body.get("shippingType");
        if (!List.of("FREE", "PAID").contains(shippingType)) {
            throw new IllegalArgumentException("Invalid shipping type. Use FREE or PAID");
        }
        product.setShippingType(shippingType);
        return productRepository.save(product);
    }

    @GetMapping("/auctions")
    public List<Auction> auctions(HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        getOrCreateProfile(userId);
        return auctionRepository.findByVendorId(userId);
    }

    @GetMapping("/orders/list")
    public List<Order> listOrders(HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return orderService.getVendorOrders(userId);
    }

    @PutMapping("/orders/{orderId}/status")
    public Order updateOrderStatus(@PathVariable Long orderId, @RequestBody Map<String, String> body, HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return orderService.updateOrderStatus(orderId, userId, body.get("status"));
    }

    @GetMapping("/customers/{customerId}")
    public Map<String, Object> customerProfile(@PathVariable Long customerId, HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User customer = userRepository.findById(customerId)
            .orElseThrow(() -> new IllegalArgumentException("Customer not found"));
        return Map.of(
            "id", customer.getId(),
            "email", customer.getEmail(),
            "displayName", customer.getDisplayName(),
            "phone", customer.getPhone() != null ? customer.getPhone() : "",
            "avatarUrl", customer.getAvatarUrl() != null ? customer.getAvatarUrl() : ""
        );
    }

    @GetMapping("/analytics")
    public Map<String, Object> analytics(HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        List<VendorCommission> commissions = vendorCommissionRepository.findByVendorId(userId);

        // Monthly sales grouped by year-month
        Map<YearMonth, List<VendorCommission>> byMonth = commissions.stream()
            .collect(Collectors.groupingBy(
                c -> YearMonth.from(c.getCreatedAt().atZone(java.time.ZoneOffset.UTC)),
                LinkedHashMap::new,
                Collectors.toList()
            ));
        List<Map<String, Object>> monthlySales = new ArrayList<>();
        for (var entry : byMonth.entrySet()) {
            YearMonth ym = entry.getKey();
            List<VendorCommission> monthComms = entry.getValue();
            double totalSale = monthComms.stream().mapToDouble(c -> c.getSaleAmountBdt().doubleValue()).sum();
            double totalNet = monthComms.stream().mapToDouble(c -> c.getNetPayoutBdt().doubleValue()).sum();
            double totalCommission = monthComms.stream().mapToDouble(c -> c.getCommissionBdt().doubleValue()).sum();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("month", ym.getMonthValue());
            m.put("year", ym.getYear());
            m.put("label", ym.getMonth().toString().substring(0, 3) + " " + String.valueOf(ym.getYear()).substring(2));
            m.put("totalSale", totalSale);
            m.put("totalCommission", totalCommission);
            m.put("netPayout", totalNet);
            m.put("orderCount", monthComms.size());
            monthlySales.add(m);
        }

        // Top products by sales
        Map<String, Double> productSales = new LinkedHashMap<>();
        for (VendorCommission c : commissions) {
            String name = c.getOrderItem().getProduct() != null ? c.getOrderItem().getProduct().getName() : "N/A";
            productSales.merge(name, c.getSaleAmountBdt().doubleValue(), Double::sum);
        }
        List<Map<String, Object>> topProducts = productSales.entrySet().stream()
            .sorted((a, b) -> Double.compare(b.getValue(), a.getValue()))
            .limit(5)
            .map(e -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", e.getKey());
                m.put("totalRevenue", e.getValue());
                return m;
            })
            .toList();

        // Low stock products — skip inventory query, just count products
        List<Product> allProducts = productRepository.findByVendorId(userId).stream()
            .filter(p -> p.getDeletedAt() == null).toList();

        return Map.of(
            "monthlySales", monthlySales,
            "topProducts", topProducts,
            "totalRevenue", commissions.stream().filter(c -> "PAID".equals(c.getStatus()))
                .mapToDouble(c -> c.getNetPayoutBdt().doubleValue()).sum(),
            "totalOrders", commissions.size(),
            "totalProducts", allProducts.size(),
            "pendingOrders", commissions.stream().filter(c -> "PENDING".equals(c.getStatus())).count()
        );
    }

    private VendorProfile getOrCreateProfile(Long userId) {
        return vendorProfileRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            VendorProfile p = new VendorProfile();
            p.setUser(user);
            p.setShopName(user.getDisplayName() + "'s Shop");
            p.setShopSlug("shop-" + userId + "-" + java.util.UUID.randomUUID().toString().substring(0, 6));
            p.setVerificationStatus("PENDING");
            return vendorProfileRepository.save(p);
        });
    }
}
