package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Auction;
import atom.example.demo.model.Order;
import atom.example.demo.model.OrderItem;
import atom.example.demo.model.Product;
import atom.example.demo.model.User;
import atom.example.demo.model.Shop;
import atom.example.demo.model.VendorCommission;
import atom.example.demo.model.VendorProfile;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.OrderItemRepository;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorCommissionRepository;
import atom.example.demo.repository.VendorProfileRepository;
import atom.example.demo.repository.ShopRepository;
import atom.example.demo.service.OrderService;
import atom.example.demo.service.ShopService;
import atom.example.demo.service.TrustService;
import jakarta.servlet.http.HttpSession;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.web.bind.annotation.*;

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
    private final ShopService shopService;
    private final ShopRepository shopRepository;
    private final TrustService trustService;

    public VendorPanelController(VendorProfileRepository vendorProfileRepository,
            AuctionRepository auctionRepository, ProductRepository productRepository,
            VendorCommissionRepository vendorCommissionRepository,
            OrderItemRepository orderItemRepository, UserRepository userRepository,
            OrderService orderService, ShopService shopService, ShopRepository shopRepository,
            TrustService trustService) {
        this.vendorProfileRepository = vendorProfileRepository;
        this.auctionRepository = auctionRepository;
        this.productRepository = productRepository;
        this.vendorCommissionRepository = vendorCommissionRepository;
        this.orderItemRepository = orderItemRepository;
        this.userRepository = userRepository;
        this.orderService = orderService;
        this.shopService = shopService;
        this.shopRepository = shopRepository;
        this.trustService = trustService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@RequestParam(required = false) Long shopId, HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        
        shopService.ensureDefaultShop(userId);
        VendorProfile profile = getOrCreateProfile(userId);
        List<Shop> shops = shopRepository.findByVendorId(userId);

        List<Auction> auctions;
        List<Product> products;
        List<VendorCommission> commissions = vendorCommissionRepository.findByVendorId(userId);

        if (shopId != null) {
            Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
            if (!shop.getVendor().getId().equals(userId)) {
                throw new SecurityException("Not your shop");
            }
            auctions = auctionRepository.findByShopId(shopId);
            products = productRepository.findByShopId(shopId);
            commissions = commissions.stream()
                .filter(c -> c.getOrderItem().getProduct() != null &&
                             c.getOrderItem().getProduct().getShop() != null &&
                             c.getOrderItem().getProduct().getShop().getId().equals(shopId))
                .toList();
        } else {
            auctions = auctionRepository.findByVendorId(userId);
            products = productRepository.findByVendorId(userId);
        }

        long activeAuctions = auctions.stream().filter(a -> "ACTIVE".equals(a.getStatus())).count();
        long pendingAuctions = auctions.stream().filter(a -> "CREATED".equals(a.getStatus())).count();
        long totalOrders = commissions.size();
        long pendingCommissions = commissions.stream().filter(c -> "PENDING".equals(c.getStatus())).count();
        double totalEarned = commissions.stream().filter(c -> "PAID".equals(c.getStatus())).mapToDouble(c -> c.getNetPayoutBdt().doubleValue()).sum();
        long totalProducts = products.stream().filter(p -> p.getDeletedAt() == null).count();

        Map<String, Object> dashboardData = new LinkedHashMap<>();
        dashboardData.put("vendorId", profile.getId());
        dashboardData.put("shopName", profile.getShopName());
        dashboardData.put("verificationStatus", profile.getVerificationStatus());
        dashboardData.put("totalAuctions", auctions.size());
        dashboardData.put("activeAuctions", activeAuctions);
        dashboardData.put("pendingAuctions", pendingAuctions);
        dashboardData.put("totalProducts", totalProducts);
        dashboardData.put("totalOrders", totalOrders);
        dashboardData.put("pendingCommissions", pendingCommissions);
        dashboardData.put("totalEarned", totalEarned);
        dashboardData.put("shops", shops);
        return dashboardData;
    }

    @GetMapping("/orders")
    public List<Map<String, Object>> orders(@RequestParam(required = false) Long shopId, HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        
        shopService.ensureDefaultShop(userId);
        List<VendorCommission> commissions = vendorCommissionRepository.findByVendorId(userId);
        if (shopId != null) {
            Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
            if (!shop.getVendor().getId().equals(userId)) {
                throw new SecurityException("Not your shop");
            }
            commissions = commissions.stream()
                .filter(c -> c.getOrderItem().getProduct() != null &&
                             c.getOrderItem().getProduct().getShop() != null &&
                             c.getOrderItem().getProduct().getShop().getId().equals(shopId))
                .toList();
        }

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
    public List<Product> products(@RequestParam(required = false) Long shopId, HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        
        shopService.ensureDefaultShop(userId);
        if (shopId != null) {
            Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
            if (!shop.getVendor().getId().equals(userId)) {
                throw new SecurityException("Not your shop");
            }
            return productRepository.findByShopId(shopId).stream()
                .filter(p -> p.getDeletedAt() == null)
                .toList();
        }

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
    public List<Auction> auctions(@RequestParam(required = false) Long shopId, HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        
        shopService.ensureDefaultShop(userId);
        if (shopId != null) {
            Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
            if (!shop.getVendor().getId().equals(userId)) {
                throw new SecurityException("Not your shop");
            }
            return auctionRepository.findByShopId(shopId);
        }
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
    public Map<String, Object> analytics(@RequestParam(required = false) Long shopId,
                                          @RequestParam(required = false, defaultValue = "monthly") String timeRange,
                                          HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        
        shopService.ensureDefaultShop(userId);
        List<VendorCommission> commissions = vendorCommissionRepository.findByVendorId(userId);
        if (shopId != null) {
            Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
            if (!shop.getVendor().getId().equals(userId)) {
                throw new SecurityException("Not your shop");
            }
            commissions = commissions.stream()
                .filter(c -> c.getOrderItem().getProduct() != null &&
                             c.getOrderItem().getProduct().getShop() != null &&
                             c.getOrderItem().getProduct().getShop().getId().equals(shopId))
                .toList();
        }

        java.time.Instant now = java.time.Instant.now();
        java.time.ZoneOffset utc = java.time.ZoneOffset.UTC;

        // Filter commissions by time range
        List<VendorCommission> filteredCommissions;
        if ("daily".equals(timeRange)) {
            filteredCommissions = commissions.stream()
                .filter(c -> c.getCreatedAt().isAfter(now.minus(java.time.Duration.ofDays(30))))
                .toList();
        } else if ("weekly".equals(timeRange)) {
            filteredCommissions = commissions.stream()
                .filter(c -> c.getCreatedAt().isAfter(now.minus(java.time.Duration.ofDays(90))))
                .toList();
        } else {
            filteredCommissions = commissions;
        }

        // Daily or weekly or monthly sales grouping
        List<Map<String, Object>> salesData;
        if ("daily".equals(timeRange)) {
            // Group by day
            Map<java.time.LocalDate, List<VendorCommission>> byDay = filteredCommissions.stream()
                .collect(Collectors.groupingBy(
                    c -> c.getCreatedAt().atZone(utc).toLocalDate(),
                    LinkedHashMap::new,
                    Collectors.toList()
                ));
            salesData = new ArrayList<>();
            for (var entry : byDay.entrySet()) {
                var dayComms = entry.getValue();
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("label", entry.getKey().toString());
                m.put("totalSale", dayComms.stream().mapToDouble(c -> c.getSaleAmountBdt().doubleValue()).sum());
                m.put("netPayout", dayComms.stream().mapToDouble(c -> c.getNetPayoutBdt().doubleValue()).sum());
                m.put("orderCount", dayComms.size());
                salesData.add(m);
            }
        } else if ("weekly".equals(timeRange)) {
            // Group by ISO week
            Map<String, List<VendorCommission>> byWeek = filteredCommissions.stream()
                .collect(Collectors.groupingBy(
                    c -> {
                        var zdt = c.getCreatedAt().atZone(utc);
                        return zdt.getYear() + "-W" + String.format("%02d", zdt.get(java.time.temporal.IsoFields.WEEK_OF_WEEK_BASED_YEAR));
                    },
                    LinkedHashMap::new,
                    Collectors.toList()
                ));
            salesData = new ArrayList<>();
            for (var entry : byWeek.entrySet()) {
                var weekComms = entry.getValue();
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("label", entry.getKey());
                m.put("totalSale", weekComms.stream().mapToDouble(c -> c.getSaleAmountBdt().doubleValue()).sum());
                m.put("netPayout", weekComms.stream().mapToDouble(c -> c.getNetPayoutBdt().doubleValue()).sum());
                m.put("orderCount", weekComms.size());
                salesData.add(m);
            }
        } else {
            // Monthly (existing logic)
            Map<YearMonth, List<VendorCommission>> byMonth = filteredCommissions.stream()
                .collect(Collectors.groupingBy(
                    c -> YearMonth.from(c.getCreatedAt().atZone(utc)),
                    LinkedHashMap::new,
                    Collectors.toList()
                ));
            salesData = new ArrayList<>();
            for (var entry : byMonth.entrySet()) {
                YearMonth ym = entry.getKey();
                List<VendorCommission> monthComms = entry.getValue();
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("label", ym.getMonth().toString().substring(0, 3) + " " + String.valueOf(ym.getYear()).substring(2));
                m.put("totalSale", monthComms.stream().mapToDouble(c -> c.getSaleAmountBdt().doubleValue()).sum());
                m.put("netPayout", monthComms.stream().mapToDouble(c -> c.getNetPayoutBdt().doubleValue()).sum());
                m.put("orderCount", monthComms.size());
                salesData.add(m);
            }
        }

        // Top products by sales
        Map<String, Double> productSales = new LinkedHashMap<>();
        for (VendorCommission c : filteredCommissions) {
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

        // Stock products count
        List<Product> allProducts;
        if (shopId != null) {
            allProducts = productRepository.findByShopId(shopId).stream()
                .filter(p -> p.getDeletedAt() == null).toList();
        } else {
            allProducts = productRepository.findByVendorId(userId).stream()
                .filter(p -> p.getDeletedAt() == null).toList();
        }

        // Unique customer count
        long uniqueCustomers = filteredCommissions.stream()
            .map(c -> c.getOrderItem().getOrder().getCustomer().getId())
            .distinct()
            .count();

        // Most-viewed products — real view tracking
        List<Map<String, Object>> mostViewed = allProducts.stream()
            .sorted((a, b) -> Integer.compare(b.getViewCount(), a.getViewCount()))
            .limit(5)
            .map(p -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("name", p.getName());
                m.put("viewCount", p.getViewCount());
                return m;
            })
            .toList();

        return Map.of(
            "salesData", salesData,
            "timeRange", timeRange,
            "topProducts", topProducts,
            "mostViewedProducts", mostViewed,
            "totalRevenue", filteredCommissions.stream().filter(c -> "PAID".equals(c.getStatus()))
                .mapToDouble(c -> c.getNetPayoutBdt().doubleValue()).sum(),
            "totalOrders", filteredCommissions.size(),
            "totalProducts", allProducts.size(),
            "pendingOrders", filteredCommissions.stream().filter(c -> "PENDING".equals(c.getStatus())).count(),
            "uniqueCustomers", uniqueCustomers
        );
    }

    @GetMapping("/trust-score")
    public Map<String, Object> getTrustScore(HttpSession session) {
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");

        var ts = trustService.getScore(userId);
        var events = trustService.getEvents(userId);
        return Map.of(
            "score", ts != null ? ts.getScore() : java.math.BigDecimal.valueOf(50),
            "events", events
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
            p.setVerificationStatus("VERIFIED");
            return vendorProfileRepository.save(p);
        });
    }
}
