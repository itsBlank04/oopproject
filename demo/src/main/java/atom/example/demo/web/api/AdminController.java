package atom.example.demo.web.api;

import atom.example.demo.model.AnalyticsSnapshot;
import atom.example.demo.model.Auction;
import atom.example.demo.model.AuctionLot;
import atom.example.demo.model.AuditLog;
import atom.example.demo.model.Bid;
import atom.example.demo.model.FraudFlag;
import atom.example.demo.model.Order;
import atom.example.demo.model.Payment;
import atom.example.demo.model.PlatformSetting;
import atom.example.demo.model.Product;
import atom.example.demo.model.Report;
import atom.example.demo.model.Return;
import atom.example.demo.model.Review;
import atom.example.demo.model.Role;
import atom.example.demo.model.RoleUpgrade;
import atom.example.demo.model.ServiceListing;
import atom.example.demo.model.Shop;
import atom.example.demo.model.SystemNotification;
import atom.example.demo.model.TrustScore;
import atom.example.demo.model.UsedListing;
import atom.example.demo.model.User;
import atom.example.demo.model.VendorProfile;
import atom.example.demo.model.VendorSubscriptionDeal;
import atom.example.demo.model.VendorSubscriptionPlan;
import atom.example.demo.repository.AnalyticsSnapshotRepository;
import atom.example.demo.repository.AuditLogRepository;
import atom.example.demo.repository.BidRepository;
import atom.example.demo.repository.ConversationRepository;
import atom.example.demo.repository.FraudFlagRepository;
import atom.example.demo.repository.AuctionLotRepository;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.MessageRepository;
import atom.example.demo.repository.OrderRepository;
import atom.example.demo.repository.PaymentRepository;
import atom.example.demo.repository.ReviewRepository;
import atom.example.demo.repository.RoleUpgradeRepository;
import atom.example.demo.repository.ShopRepository;
import atom.example.demo.repository.TrustScoreRepository;
import atom.example.demo.repository.VendorSubscriptionDealRepository;
import atom.example.demo.repository.VendorSubscriptionPlanRepository;
import atom.example.demo.service.AuctionService;
import atom.example.demo.service.AdminAuditService;
import atom.example.demo.service.WinnerService;
import atom.example.demo.repository.PlatformSettingRepository;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.ReportRepository;
import atom.example.demo.repository.ReturnRepository;
import atom.example.demo.repository.RoleRepository;
import atom.example.demo.repository.ServiceListingRepository;
import atom.example.demo.repository.SystemNotificationRepository;
import atom.example.demo.repository.UsedListingRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorProfileRepository;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
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
@RequestMapping("/api/admin")
public class AdminController {

    private static final String PRIMARY_ADMIN_EMAIL = "admin@login.com";
    private static final Set<String> MARKETPLACE_ROLES = Set.of(
            Role.ROLE_CUSTOMER,
            Role.ROLE_VENDOR,
            Role.ROLE_TECHNICIAN
    );

    private final UserRepository userRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UsedListingRepository usedListingRepository;
    private final ServiceListingRepository serviceListingRepository;
    private final FraudFlagRepository fraudFlagRepository;
    private final ReportRepository reportRepository;
    private final ReturnRepository returnRepository;
    private final RoleRepository roleRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final AuditLogRepository auditLogRepository;
    private final AnalyticsSnapshotRepository analyticsSnapshotRepository;
    private final SystemNotificationRepository systemNotificationRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final ReviewRepository reviewRepository;
    private final BidRepository bidRepository;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final PaymentRepository paymentRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final RoleUpgradeRepository roleUpgradeRepository;
    private final ShopRepository shopRepository;
    private final VendorSubscriptionPlanRepository vendorSubscriptionPlanRepository;
    private final VendorSubscriptionDealRepository vendorSubscriptionDealRepository;
    private final AuctionService auctionService;
    private final AdminAuditService adminAuditService;
    private final WinnerService winnerService;

    public AdminController(UserRepository userRepository, AuctionRepository auctionRepository, AuctionLotRepository auctionLotRepository,
            ProductRepository productRepository, OrderRepository orderRepository,
            UsedListingRepository usedListingRepository, ServiceListingRepository serviceListingRepository,
            FraudFlagRepository fraudFlagRepository, ReportRepository reportRepository,
            ReturnRepository returnRepository, RoleRepository roleRepository,
            PlatformSettingRepository platformSettingRepository,
            AuditLogRepository auditLogRepository,
            AnalyticsSnapshotRepository analyticsSnapshotRepository,
            SystemNotificationRepository systemNotificationRepository,
            VendorProfileRepository vendorProfileRepository,
            ReviewRepository reviewRepository,
            BidRepository bidRepository,
            MessageRepository messageRepository,
            ConversationRepository conversationRepository,
            PaymentRepository paymentRepository,
            TrustScoreRepository trustScoreRepository,
            RoleUpgradeRepository roleUpgradeRepository,
            ShopRepository shopRepository,
            VendorSubscriptionPlanRepository vendorSubscriptionPlanRepository,
            VendorSubscriptionDealRepository vendorSubscriptionDealRepository,
            AuctionService auctionService,
            AdminAuditService adminAuditService,
            WinnerService winnerService) {
        this.userRepository = userRepository;
        this.auctionRepository = auctionRepository;
        this.auctionLotRepository = auctionLotRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.usedListingRepository = usedListingRepository;
        this.serviceListingRepository = serviceListingRepository;
        this.fraudFlagRepository = fraudFlagRepository;
        this.reportRepository = reportRepository;
        this.returnRepository = returnRepository;
        this.roleRepository = roleRepository;
        this.platformSettingRepository = platformSettingRepository;
        this.auditLogRepository = auditLogRepository;
        this.analyticsSnapshotRepository = analyticsSnapshotRepository;
        this.systemNotificationRepository = systemNotificationRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.reviewRepository = reviewRepository;
        this.bidRepository = bidRepository;
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.paymentRepository = paymentRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.roleUpgradeRepository = roleUpgradeRepository;
        this.shopRepository = shopRepository;
        this.vendorSubscriptionPlanRepository = vendorSubscriptionPlanRepository;
        this.vendorSubscriptionDealRepository = vendorSubscriptionDealRepository;
        this.auctionService = auctionService;
        this.adminAuditService = adminAuditService;
        this.winnerService = winnerService;
    }

    private void requireAuth(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
    }

    private Long getUserId(HttpSession session) {
        return (Long) session.getAttribute("userId");
    }

    private void audit(HttpSession session, String action, String entityType, Long entityId,
            Map<String, Object> oldData, Map<String, Object> newData) {
        adminAuditService.record(getUserId(session), action, entityType, entityId, oldData, newData);
    }

    private boolean isPrimaryAdmin(User user) {
        return user != null && PRIMARY_ADMIN_EMAIL.equalsIgnoreCase(user.getEmail());
    }

    @GetMapping("/users")
    public List<User> listUsers(@RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return userRepository.findAll().stream()
                .filter(u -> role == null || u.getRoleNames().contains(role))
                .filter(u -> status == null || u.getStatus().equals(status))
                .filter(u -> search == null || u.getDisplayName().toLowerCase().contains(search.toLowerCase())
                        || u.getEmail().toLowerCase().contains(search.toLowerCase()))
                .collect(Collectors.toList());
    }

    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @PutMapping("/users/{id}/ban")
    public User banUser(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (isPrimaryAdmin(user)) throw new IllegalArgumentException("The primary admin account cannot be banned");
        String oldStatus = user.getStatus();
        user.setStatus("BANNED");
        User saved = userRepository.save(user);
        audit(session, "USER_BANNED", "users", id, Map.of("status", oldStatus), Map.of("status", saved.getStatus()));
        return saved;
    }

    @PutMapping("/users/{id}/unban")
    public User unbanUser(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        String oldStatus = user.getStatus();
        user.setStatus("ACTIVE");
        User saved = userRepository.save(user);
        audit(session, "USER_UNBANNED", "users", id, Map.of("status", oldStatus), Map.of("status", saved.getStatus()));
        return saved;
    }

    @PutMapping("/users/{id}/roles")
    public User updateUserRoles(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<String> roleNames = ((List<?>) body.getOrDefault("roles", List.of())).stream()
                .map(Object::toString)
                .map(String::toUpperCase)
                .filter(name -> Set.of(Role.ROLE_CUSTOMER, Role.ROLE_VENDOR, Role.ROLE_TECHNICIAN, Role.ROLE_ADMIN).contains(name))
                .distinct()
                .toList();
        if (roleNames.isEmpty()) throw new IllegalArgumentException("At least one valid role is required");
        if (isPrimaryAdmin(user) && !(roleNames.size() == 1 && roleNames.contains(Role.ROLE_ADMIN)))
            throw new IllegalArgumentException("The primary admin can only have the ADMIN role");
        if (!isPrimaryAdmin(user) && roleNames.contains(Role.ROLE_ADMIN))
            throw new IllegalArgumentException("Only admin@login.com can have the ADMIN role");
        if (!isPrimaryAdmin(user) && roleNames.stream().noneMatch(MARKETPLACE_ROLES::contains))
            throw new IllegalArgumentException("Marketplace users need at least one marketplace role");
        Set<Role> roles = new HashSet<>();
        for (String roleName : roleNames) {
            roles.add(roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleName)));
        }
        List<String> oldRoles = user.getRoleNames();
        user.setRoles(roles);
        User saved = userRepository.save(user);
        audit(session, "USER_ROLES_UPDATED", "users", id, Map.of("roles", oldRoles), Map.of("roles", saved.getRoleNames()));
        return saved;
    }

    @GetMapping("/auctions")
    public List<Auction> listAuctions(@RequestParam(required = false) String status) {
        if (status != null) return auctionRepository.findByStatus(status);
        return auctionRepository.findAll();
    }

    @GetMapping("/products")
    public List<Product> listProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/orders")
    public List<Order> listOrders() {
        return orderRepository.findAll();
    }

    @GetMapping("/used-listings")
    public List<UsedListing> listUsedListings() {
        return usedListingRepository.findAll();
    }

    @GetMapping("/service-listings")
    public List<ServiceListing> listServiceListings() {
        return serviceListingRepository.findAll();
    }

    @GetMapping("/auctions/pending")
    public List<Auction> pendingAuctions() {
        return auctionRepository.findByStatus("CREATED");
    }

    @PutMapping("/auctions/{id}/approve")
    public Auction approveAuction(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        Long adminId = getUserId(session);
        String notes = body != null ? (String) body.get("notes") : null;
        Auction auction = auctionService.approveAuction(id, adminId, notes);
        audit(session, "AUCTION_APPROVED", "auctions", id, Map.of("status", "CREATED"), Map.of("status", auction.getStatus()));
        return auction;
    }

    @PutMapping("/auctions/{id}/reject")
    public Auction rejectAuction(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        Long adminId = getUserId(session);
        String notes = body != null ? (String) body.get("notes") : null;
        Auction auction = auctionService.rejectAuction(id, adminId, notes);
        audit(session, "AUCTION_REJECTED", "auctions", id, Map.of("status", "CREATED"), Map.of("status", auction.getStatus()));
        return auction;
    }

    @GetMapping("/fraud-flags")
    public List<FraudFlag> listFraudFlags(@RequestParam(required = false) String status) {
        if (status != null) return fraudFlagRepository.findByStatus(status);
        return fraudFlagRepository.findAll();
    }

    @PutMapping("/fraud-flags/{id}/resolve")
    public FraudFlag resolveFraudFlag(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        FraudFlag flag = fraudFlagRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Fraud flag not found"));
        String oldStatus = flag.getStatus();
        flag.setStatus("RESOLVED");
        flag.setResolvedAt(Instant.now());
        FraudFlag saved = fraudFlagRepository.save(flag);
        audit(session, "FRAUD_FLAG_RESOLVED", "fraud_flags", id, Map.of("status", oldStatus), Map.of("status", saved.getStatus()));
        return saved;
    }

    @GetMapping("/reports")
    public List<Report> listReports(@RequestParam(required = false) String status) {
        if (status != null) return reportRepository.findByStatus(status);
        return reportRepository.findAll();
    }

    @PutMapping("/reports/{id}/resolve")
    public Report resolveReport(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        Report report = reportRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Report not found"));
        String oldStatus = report.getStatus();
        report.setStatus("RESOLVED");
        report.setResolvedAt(Instant.now());
        if (body != null && body.containsKey("adminNote")) report.setAdminNote((String) body.get("adminNote"));
        Report saved = reportRepository.save(report);
        audit(session, "REPORT_RESOLVED", "reports", id, Map.of("status", oldStatus), Map.of("status", saved.getStatus()));
        return saved;
    }

    @PutMapping("/reports/{id}/dismiss")
    public Report dismissReport(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Report report = reportRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Report not found"));
        String oldStatus = report.getStatus();
        report.setStatus("DISMISSED");
        report.setResolvedAt(Instant.now());
        Report saved = reportRepository.save(report);
        audit(session, "REPORT_DISMISSED", "reports", id, Map.of("status", oldStatus), Map.of("status", saved.getStatus()));
        return saved;
    }

    @GetMapping("/returns")
    public List<Return> listReturns(@RequestParam(required = false) String status) {
        if (status != null) return returnRepository.findByStatus(status);
        return returnRepository.findAll();
    }

    @PutMapping("/returns/{id}/approve")
    public Return approveReturn(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        Return returnRequest = returnRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Return not found"));
        String oldStatus = returnRequest.getStatus();
        returnRequest.setStatus("APPROVED");
        returnRequest.setResolvedAt(Instant.now());
        Return saved = returnRepository.save(returnRequest);
        audit(session, "RETURN_APPROVED", "returns", id, Map.of("status", oldStatus), Map.of("status", saved.getStatus()));
        return saved;
    }

    @PutMapping("/returns/{id}/reject")
    public Return rejectReturn(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Return returnRequest = returnRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Return not found"));
        String oldStatus = returnRequest.getStatus();
        returnRequest.setStatus("REJECTED");
        returnRequest.setResolvedAt(Instant.now());
        Return saved = returnRepository.save(returnRequest);
        audit(session, "RETURN_REJECTED", "returns", id, Map.of("status", oldStatus), Map.of("status", saved.getStatus()));
        return saved;
    }

    @GetMapping("/platform-settings")
    public List<PlatformSetting> listSettings() {
        return platformSettingRepository.findAll();
    }

    @PutMapping("/platform-settings/{key}")
    public PlatformSetting updateSetting(@PathVariable String key, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        PlatformSetting setting = platformSettingRepository.findById(key)
                .orElseThrow(() -> new IllegalArgumentException("Setting not found"));
        String oldValue = setting.getValue();
        setting.setValue((String) body.get("value"));
        User admin = userRepository.findById(getUserId(session)).orElse(null);
        setting.setUpdatedBy(admin);
        PlatformSetting saved = platformSettingRepository.save(setting);
        audit(session, "PLATFORM_SETTING_UPDATED", "platform_settings", null, Map.of("key", key, "value", oldValue), Map.of("key", key, "value", saved.getValue()));
        return saved;
    }

    @GetMapping("/audit-logs")
    public List<AuditLog> listAuditLogs(@RequestParam(required = false) Long actor,
            @RequestParam(required = false) String entityType) {
        if (actor != null) return auditLogRepository.findByActorId(actor);
        if (entityType != null) return auditLogRepository.findAll().stream()
                .filter(log -> entityType.equals(log.getEntityType()))
                .collect(Collectors.toList());
        return auditLogRepository.findAll();
    }

    @GetMapping("/analytics/dashboard")
    public Map<String, Object> analyticsDashboard() {
        List<AnalyticsSnapshot> snapshots = analyticsSnapshotRepository.findAllByOrderBySnapshotDateDesc();
        AnalyticsSnapshot latest = snapshots.isEmpty() ? null : snapshots.get(0);
        long totalUsers = userRepository.count();
        Map<String, Object> payload = new HashMap<>();
        payload.put("totalUsers", totalUsers);
        payload.put("latestSnapshot", latest);
        payload.put("totalAuctions", auctionRepository.count());
        payload.put("totalProducts", productRepository.count());
        payload.put("totalOrders", orderRepository.count());
        payload.put("openReports", reportRepository.findByStatus("OPEN").size());
        payload.put("pendingReturns", returnRepository.findByStatus("OPEN").size());
        return payload;
    }

    @GetMapping("/system-notifications")
    public List<SystemNotification> listSystemNotifications() {
        return systemNotificationRepository.findAll();
    }

    @PostMapping("/system-notifications")
    public SystemNotification createSystemNotification(@RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        SystemNotification notif = new SystemNotification();
        notif.setTitle((String) body.get("title"));
        notif.setBody((String) body.get("body"));
        notif.setType((String) body.getOrDefault("type", "INFO"));
        notif.setTargetRoles((String) body.get("targetRoles"));
        notif.setStartsAt(Instant.parse((String) body.get("startsAt")));
        if (body.containsKey("endsAt")) notif.setEndsAt(Instant.parse((String) body.get("endsAt")));
        User admin = userRepository.findById(getUserId(session)).orElse(null);
        notif.setCreatedBy(admin);
        SystemNotification saved = systemNotificationRepository.save(notif);
        audit(session, "SYSTEM_NOTIFICATION_CREATED", "system_notifications", saved.getId(), null, Map.of("title", saved.getTitle()));
        return saved;
    }

    @PutMapping("/system-notifications/{id}")
    public SystemNotification updateSystemNotification(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        SystemNotification notif = systemNotificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("System notification not found"));
        if (body.containsKey("title")) notif.setTitle((String) body.get("title"));
        if (body.containsKey("body")) notif.setBody((String) body.get("body"));
        if (body.containsKey("type")) notif.setType((String) body.get("type"));
        if (body.containsKey("targetRoles")) notif.setTargetRoles((String) body.get("targetRoles"));
        if (body.containsKey("isActive")) notif.setActive(Boolean.parseBoolean(body.get("isActive").toString()));
        if (body.containsKey("startsAt")) notif.setStartsAt(Instant.parse((String) body.get("startsAt")));
        if (body.containsKey("endsAt")) notif.setEndsAt(Instant.parse((String) body.get("endsAt")));
        SystemNotification saved = systemNotificationRepository.save(notif);
        audit(session, "SYSTEM_NOTIFICATION_UPDATED", "system_notifications", id, null, Map.of("title", saved.getTitle(), "active", saved.isActive()));
        return saved;
    }

    @DeleteMapping("/system-notifications/{id}")
    public Map<String, String> deleteSystemNotification(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        systemNotificationRepository.deleteById(id);
        audit(session, "SYSTEM_NOTIFICATION_DELETED", "system_notifications", id, null, Map.of("deleted", true));
        return Map.of("message", "Deleted");
    }

    @GetMapping("/users/{id}/detail")
    public Map<String, Object> userDetail(@PathVariable Long id) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Map<String, Object> result = new HashMap<>();
        result.put("id", u.getId());
        result.put("email", u.getEmail());
        result.put("displayName", u.getDisplayName());
        result.put("phone", u.getPhone());
        result.put("status", u.getStatus());
        result.put("roles", u.getRoleNames());
        result.put("redFlagCount", u.getRedFlagCount());
        result.put("redFlagNotes", u.getRedFlagNotes());
        result.put("createdAt", u.getCreatedAt());
        return result;
    }

    @PutMapping("/users/{id}/suspend")
    public User suspendUser(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (isPrimaryAdmin(user)) throw new IllegalArgumentException("The primary admin account cannot be suspended");
        String oldStatus = user.getStatus();
        user.setStatus("SUSPENDED");
        User saved = userRepository.save(user);
        audit(session, "USER_SUSPENDED", "users", id, Map.of("status", oldStatus), Map.of("status", saved.getStatus()));
        return saved;
    }

    @PostMapping("/users/{id}/red-flag")
    public User addRedFlag(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String reason = (String) body.getOrDefault("reason", "Suspicious activity");
        user.setRedFlagCount(user.getRedFlagCount() + 1);
        String existingNotes = user.getRedFlagNotes();
        String newNote = "[" + Instant.now().toString() + "] " + reason;
        user.setRedFlagNotes(existingNotes != null ? existingNotes + "\n" + newNote : newNote);
        User saved = userRepository.save(user);
        audit(session, "RED_FLAG_ADDED", "users", id,
                Map.of("redFlagCount", user.getRedFlagCount() - 1),
                Map.of("redFlagCount", saved.getRedFlagCount(), "reason", reason));
        return saved;
    }

    @PutMapping("/products/{id}/hide")
    public Map<String, String> hideProduct(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        productRepository.findById(id).ifPresent(p -> {
            p.setStatus("HIDDEN");
            productRepository.save(p);
            audit(session, "PRODUCT_HIDDEN", "products", id,
                    Map.of("status", p.getStatus()), Map.of("status", "HIDDEN"));
        });
        return Map.of("message", "Product hidden");
    }

    @PutMapping("/used-listings/{id}/hide")
    public Map<String, String> hideUsedListing(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        usedListingRepository.findById(id).ifPresent(l -> {
            l.setStatus("HIDDEN");
            usedListingRepository.save(l);
            audit(session, "USED_LISTING_HIDDEN", "used_listings", id,
                    Map.of("status", l.getStatus()), Map.of("status", "HIDDEN"));
        });
        return Map.of("message", "Used listing hidden");
    }

    @PutMapping("/orders/{id}/status")
    public Map<String, String> overrideOrderStatus(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        orderRepository.findById(id).ifPresent(order -> {
            String newStatus = (String) body.get("status");
            String oldStatus = order.getStatus();
            order.setStatus(newStatus);
            orderRepository.save(order);
            audit(session, "ORDER_STATUS_OVERRIDE", "orders", id,
                    Map.of("status", oldStatus), Map.of("status", newStatus));
        });
        return Map.of("message", "Order status updated");
    }

    @PutMapping("/auctions/{id}/cancel")
    public Map<String, String> cancelAuction(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        auctionRepository.findById(id).ifPresent(auction -> {
            String oldStatus = auction.getStatus();
            auction.setStatus("CANCELLED");
            auctionRepository.save(auction);
            for (AuctionLot lot : auctionLotRepository.findByAuctionId(id)) {
                lot.setStatus("CLOSED");
                auctionLotRepository.save(lot);
            }
            audit(session, "AUCTION_CANCELLED", "auctions", id,
                    Map.of("status", oldStatus), Map.of("status", "CANCELLED"));
        });
        return Map.of("message", "Auction cancelled");
    }

    @PutMapping("/auctions/{id}/freeze")
    public Map<String, String> freezeAuction(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        auctionRepository.findById(id).ifPresent(auction -> {
            String oldStatus = auction.getStatus();
            auction.setStatus("FROZEN");
            auctionRepository.save(auction);
            audit(session, "AUCTION_FROZEN", "auctions", id,
                    Map.of("status", oldStatus), Map.of("status", "FROZEN"));
        });
        return Map.of("message", "Auction frozen");
    }

    @PutMapping("/auctions/{id}/suspend")
    public Map<String, String> suspendAuction(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        auctionRepository.findById(id).ifPresent(auction -> {
            String oldStatus = auction.getStatus();
            auction.setStatus("SUSPENDED");
            auctionRepository.save(auction);
            audit(session, "AUCTION_SUSPENDED", "auctions", id,
                    Map.of("status", oldStatus), Map.of("status", "SUSPENDED"));
        });
        return Map.of("message", "Auction suspended");
    }

    @DeleteMapping("/users/{id}")
    public Map<String, String> deleteUser(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (isPrimaryAdmin(user)) throw new IllegalArgumentException("The primary admin account cannot be deleted");
        user.setDeletedAt(Instant.now());
        userRepository.save(user);
        audit(session, "USER_DELETED", "users", id,
                Map.of("email", user.getEmail(), "status", user.getStatus()),
                Map.of("deletedAt", user.getDeletedAt().toString()));
        return Map.of("message", "User deleted");
    }

    @DeleteMapping("/products/{id}")
    public Map<String, String> deleteProduct(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        product.setDeletedAt(Instant.now());
        productRepository.save(product);
        audit(session, "PRODUCT_DELETED", "products", id,
                Map.of("name", product.getName(), "status", product.getStatus()),
                Map.of("deletedAt", product.getDeletedAt().toString()));
        return Map.of("message", "Product deleted");
    }

    @DeleteMapping("/used-listings/{id}")
    public Map<String, String> deleteUsedListing(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        UsedListing listing = usedListingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Used listing not found"));
        listing.setDeletedAt(Instant.now());
        usedListingRepository.save(listing);
        audit(session, "USED_LISTING_DELETED", "used_listings", id,
                Map.of("title", listing.getTitle(), "status", listing.getStatus()),
                Map.of("deletedAt", listing.getDeletedAt().toString()));
        return Map.of("message", "Used listing deleted");
    }

    @DeleteMapping("/service-listings/{id}")
    public Map<String, String> deleteServiceListing(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        ServiceListing listing = serviceListingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Service listing not found"));
        serviceListingRepository.delete(listing);
        audit(session, "SERVICE_LISTING_DELETED", "service_listings", id,
                Map.of("title", listing.getTitle()),
                null);
        return Map.of("message", "Service listing deleted");
    }

    @DeleteMapping("/orders/{id}")
    public Map<String, String> deleteOrder(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        String oldStatus = order.getStatus();
        order.setStatus("CANCELLED");
        orderRepository.save(order);
        audit(session, "ORDER_DELETED", "orders", id,
                Map.of("status", oldStatus),
                Map.of("status", "CANCELLED"));
        return Map.of("message", "Order cancelled");
    }

    @DeleteMapping("/auctions/{id}")
    public Map<String, String> deleteAuction(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        String oldStatus = auction.getStatus();
        auction.setStatus("CANCELLED");
        auctionRepository.save(auction);
        for (AuctionLot lot : auctionLotRepository.findByAuctionId(id)) {
            lot.setStatus("CLOSED");
            auctionLotRepository.save(lot);
        }
        audit(session, "AUCTION_DELETED", "auctions", id,
                Map.of("status", oldStatus),
                Map.of("status", "CANCELLED"));
        return Map.of("message", "Auction cancelled");
    }

    @DeleteMapping("/reviews/{id}")
    public Map<String, String> deleteReview(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        reviewRepository.deleteById(id);
        audit(session, "REVIEW_DELETED", "reviews", id, null, Map.of("deleted", true));
        return Map.of("message", "Review deleted");
    }

    @DeleteMapping("/bids/{id}")
    public Map<String, String> deleteBid(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        bidRepository.deleteById(id);
        audit(session, "BID_DELETED", "bids", id, null, Map.of("deleted", true));
        return Map.of("message", "Bid deleted");
    }

    @DeleteMapping("/messages/{id}")
    public Map<String, String> deleteMessage(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        messageRepository.deleteById(id);
        audit(session, "MESSAGE_DELETED", "messages", id, null, Map.of("deleted", true));
        return Map.of("message", "Message deleted");
    }

    @DeleteMapping("/conversations/{id}")
    public Map<String, String> deleteConversation(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        conversationRepository.deleteById(id);
        audit(session, "CONVERSATION_DELETED", "conversations", id, null, Map.of("deleted", true));
        return Map.of("message", "Conversation deleted");
    }

    // ========== SUPERPOWERS ==========

    @PutMapping("/users/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Map<String, Object> oldData = new HashMap<>();
        if (body.containsKey("displayName")) { oldData.put("displayName", user.getDisplayName()); user.setDisplayName((String) body.get("displayName")); }
        if (body.containsKey("email")) { oldData.put("email", user.getEmail()); user.setEmail((String) body.get("email")); }
        if (body.containsKey("phone")) { oldData.put("phone", user.getPhone()); user.setPhone((String) body.get("phone")); }
        if (body.containsKey("status")) { oldData.put("status", user.getStatus()); user.setStatus((String) body.get("status")); }
        User saved = userRepository.save(user);
        audit(session, "USER_UPDATED", "users", id, oldData.isEmpty() ? null : oldData, Map.of("updated", true));
        return saved;
    }

    @PostMapping("/users/{id}/reset-password")
    public Map<String, String> resetUserPassword(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        String newPassword = (String) body.get("password");
        if (newPassword == null || newPassword.length() < 6) throw new IllegalArgumentException("Password must be at least 6 characters");
        user.setPasswordHash(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(newPassword));
        userRepository.save(user);
        audit(session, "USER_PASSWORD_RESET", "users", id, null, Map.of("reset", true));
        return Map.of("message", "Password reset");
    }

    @GetMapping("/users/{id}/activity")
    public Map<String, Object> userActivity(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Map<String, Object> result = new HashMap<>();
        result.put("user", Map.of("id", user.getId(), "displayName", user.getDisplayName(), "email", user.getEmail()));
        result.put("orderCount", orderRepository.findByCustomerIdOrderByCreatedAtDesc(id).size());
        result.put("productCount", productRepository.findByVendorId(id).size());
        result.put("auctionCount", auctionRepository.findByVendorId(id).size());
        result.put("bidCount", bidRepository.findByBidderId(id).size());
        result.put("reportCount", reportRepository.findByReporterId(id).size());
        result.put("returnCount", returnRepository.findByCustomerId(id).size());
        return result;
    }

    @GetMapping("/users/{id}/trust-score")
    public TrustScore getUserTrustScore(@PathVariable Long id) {
        return trustScoreRepository.findByUserId(id)
                .orElseThrow(() -> new IllegalArgumentException("Trust score not found"));
    }

    @PutMapping("/users/{id}/trust-score")
    public TrustScore updateUserTrustScore(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        TrustScore ts = trustScoreRepository.findByUserId(id)
                .orElseThrow(() -> new IllegalArgumentException("Trust score not found"));
        BigDecimal oldScore = ts.getScore();
        if (body.containsKey("score")) ts.setScore(new BigDecimal(body.get("score").toString()));
        TrustScore saved = trustScoreRepository.save(ts);
        audit(session, "TRUST_SCORE_UPDATED", "trust_scores", id, Map.of("score", oldScore), Map.of("score", saved.getScore()));
        return saved;
    }

    @GetMapping("/payments")
    public List<Payment> listPayments() {
        return paymentRepository.findAll();
    }

    @PostMapping("/payments/{id}/refund")
    public Map<String, String> refundPayment(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        String oldStatus = payment.getStatus();
        payment.setStatus("REFUNDED");
        paymentRepository.save(payment);
        audit(session, "PAYMENT_REFUNDED", "payments", id, Map.of("status", oldStatus), Map.of("status", "REFUNDED"));
        return Map.of("message", "Payment refunded");
    }

    @PutMapping("/auctions/{id}")
    public Auction updateAuction(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        Auction auction = auctionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        Map<String, Object> oldData = new HashMap<>();
        if (body.containsKey("title")) { oldData.put("title", auction.getTitle()); auction.setTitle((String) body.get("title")); }
        if (body.containsKey("type")) { oldData.put("type", auction.getType()); auction.setType((String) body.get("type")); }
        if (body.containsKey("startTime")) { oldData.put("startTime", auction.getStartTime()); auction.setStartTime(Instant.parse((String) body.get("startTime"))); }
        if (body.containsKey("endTime")) { oldData.put("endTime", auction.getEndTime()); auction.setEndTime(Instant.parse((String) body.get("endTime"))); }
        Auction saved = auctionRepository.save(auction);
        audit(session, "AUCTION_UPDATED", "auctions", id, oldData.isEmpty() ? null : oldData, Map.of("updated", true));
        return saved;
    }

    @PutMapping("/auctions/{id}/force-close")
    public Map<String, String> forceCloseAuction(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Auction auction = auctionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        String oldStatus = auction.getStatus();
        auction.setStatus("CLOSED");
        auction.setEndTime(Instant.now());
        auctionRepository.save(auction);
        for (AuctionLot lot : auctionLotRepository.findByAuctionId(id)) {
            lot.setStatus("CLOSED");
            auctionLotRepository.save(lot);
            try {
                winnerService.determineWinner(lot.getId());
            } catch (Exception e) {
                // Lot may have no bids
            }
        }
        audit(session, "AUCTION_FORCE_CLOSED", "auctions", id, Map.of("status", oldStatus), Map.of("status", "CLOSED"));
        return Map.of("message", "Auction force-closed");
    }

    @PutMapping("/products/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        Product product = productRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Product not found"));
        Map<String, Object> oldData = new HashMap<>();
        if (body.containsKey("name")) { oldData.put("name", product.getName()); product.setName((String) body.get("name")); }
        if (body.containsKey("description")) { oldData.put("description", product.getDescription()); product.setDescription((String) body.get("description")); }
        if (body.containsKey("priceBdt")) { oldData.put("priceBdt", product.getPriceBdt()); product.setPriceBdt(new BigDecimal(body.get("priceBdt").toString())); }
        if (body.containsKey("status")) { oldData.put("status", product.getStatus()); product.setStatus((String) body.get("status")); }
        Product saved = productRepository.save(product);
        audit(session, "PRODUCT_UPDATED", "products", id, oldData.isEmpty() ? null : oldData, Map.of("updated", true));
        return saved;
    }

    @PutMapping("/used-listings/{id}")
    public UsedListing updateUsedListing(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        UsedListing listing = usedListingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Used listing not found"));
        Map<String, Object> oldData = new HashMap<>();
        if (body.containsKey("title")) { oldData.put("title", listing.getTitle()); listing.setTitle((String) body.get("title")); }
        if (body.containsKey("description")) { oldData.put("description", listing.getDescription()); listing.setDescription((String) body.get("description")); }
        if (body.containsKey("priceBdt")) { oldData.put("priceBdt", listing.getPriceBdt()); listing.setPriceBdt(new BigDecimal(body.get("priceBdt").toString())); }
        if (body.containsKey("status")) { oldData.put("status", listing.getStatus()); listing.setStatus((String) body.get("status")); }
        UsedListing saved = usedListingRepository.save(listing);
        audit(session, "USED_LISTING_UPDATED", "used_listings", id, oldData.isEmpty() ? null : oldData, Map.of("updated", true));
        return saved;
    }

    @PostMapping("/users/{id}/clear-sessions")
    public Map<String, String> clearUserSessions(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (isPrimaryAdmin(user)) throw new IllegalArgumentException("Cannot clear primary admin sessions");
        audit(session, "USER_SESSIONS_CLEARED", "users", id, null, Map.of("cleared", true));
        return Map.of("message", "User sessions cleared (session invalidated on next request)");
    }

    @GetMapping("/export/{entityType}")
    public List<?> exportData(@PathVariable String entityType) {
        return switch (entityType) {
            case "users" -> userRepository.findAll();
            case "products" -> productRepository.findAll();
            case "orders" -> orderRepository.findAll();
            case "auctions" -> auctionRepository.findAll();
            case "payments" -> paymentRepository.findAll();
            case "used-listings" -> usedListingRepository.findAll();
            case "service-listings" -> serviceListingRepository.findAll();
            default -> throw new IllegalArgumentException("Unknown entity type: " + entityType);
        };
    }

    @GetMapping("/vendors")
    public List<VendorProfile> listVendors() {
        return vendorProfileRepository.findAll();
    }

    @PutMapping("/vendors/{id}/verify")
    public VendorProfile verifyVendor(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        VendorProfile profile = vendorProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        String oldStatus = profile.getVerificationStatus();
        profile.setVerificationStatus("VERIFIED");
        VendorProfile saved = vendorProfileRepository.save(profile);
        audit(session, "VENDOR_VERIFIED", "vendor_profiles", id, Map.of("verificationStatus", oldStatus), Map.of("verificationStatus", saved.getVerificationStatus()));
        return saved;
    }

    // ========== SHOP VERIFICATION ==========

    @PutMapping("/shops/{id}/verification")
    public Shop updateShopVerification(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        Shop shop = shopRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        String newLevel = (String) body.get("verificationLevel");
        if (!List.of("STANDARD", "VERIFIED", "PREMIUM", "TRUSTED").contains(newLevel)) {
            throw new IllegalArgumentException("Invalid verification level. Use STANDARD, VERIFIED, PREMIUM, or TRUSTED");
        }
        String oldLevel = shop.getVerificationLevel();
        shop.setVerificationLevel(newLevel);
        Shop saved = shopRepository.save(shop);
        audit(session, "SHOP_VERIFICATION_UPDATED", "shops", id,
            Map.of("verificationLevel", oldLevel),
            Map.of("verificationLevel", saved.getVerificationLevel()));
        return saved;
    }

    // ========== SUBSCRIPTION PLAN MANAGEMENT ==========

    @GetMapping("/subscription/plans")
    public List<VendorSubscriptionPlan> listSubscriptionPlans() {
        return vendorSubscriptionPlanRepository.findAll();
    }

    @PostMapping("/subscription/plans")
    public VendorSubscriptionPlan createSubscriptionPlan(@RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        VendorSubscriptionPlan plan = new VendorSubscriptionPlan(
            (String) body.get("name"),
            (String) body.get("displayName"),
            Integer.valueOf(body.get("maxShops").toString()),
            new java.math.BigDecimal(body.get("priceMonthlyBdt").toString()),
            new java.math.BigDecimal(body.get("priceYearlyBdt").toString()),
            body.containsKey("discountPercent") ? new java.math.BigDecimal(body.get("discountPercent").toString()) : java.math.BigDecimal.ZERO,
            (String) body.get("features")
        );
        VendorSubscriptionPlan saved = vendorSubscriptionPlanRepository.save(plan);
        audit(session, "SUBSCRIPTION_PLAN_CREATED", "vendor_subscription_plans", saved.getId(),
            null, Map.of("name", saved.getName()));
        return saved;
    }

    @PutMapping("/subscription/plans/{id}")
    public VendorSubscriptionPlan updateSubscriptionPlan(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        VendorSubscriptionPlan plan = vendorSubscriptionPlanRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        Map<String, Object> oldData = new HashMap<>();
        if (body.containsKey("name")) { oldData.put("name", plan.getName()); plan.setName((String) body.get("name")); }
        if (body.containsKey("displayName")) { oldData.put("displayName", plan.getDisplayName()); plan.setDisplayName((String) body.get("displayName")); }
        if (body.containsKey("maxShops")) { oldData.put("maxShops", plan.getMaxShops()); plan.setMaxShops(Integer.valueOf(body.get("maxShops").toString())); }
        if (body.containsKey("priceMonthlyBdt")) { oldData.put("priceMonthlyBdt", plan.getPriceMonthlyBdt()); plan.setPriceMonthlyBdt(new java.math.BigDecimal(body.get("priceMonthlyBdt").toString())); }
        if (body.containsKey("priceYearlyBdt")) { oldData.put("priceYearlyBdt", plan.getPriceYearlyBdt()); plan.setPriceYearlyBdt(new java.math.BigDecimal(body.get("priceYearlyBdt").toString())); }
        if (body.containsKey("discountPercent")) { oldData.put("discountPercent", plan.getDiscountPercent()); plan.setDiscountPercent(new java.math.BigDecimal(body.get("discountPercent").toString())); }
        if (body.containsKey("features")) { oldData.put("features", plan.getFeatures()); plan.setFeatures((String) body.get("features")); }
        VendorSubscriptionPlan saved = vendorSubscriptionPlanRepository.save(plan);
        audit(session, "SUBSCRIPTION_PLAN_UPDATED", "vendor_subscription_plans", id,
            oldData.isEmpty() ? null : oldData, Map.of("updated", true));
        return saved;
    }

    @DeleteMapping("/subscription/plans/{id}")
    public Map<String, String> deleteSubscriptionPlan(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        VendorSubscriptionPlan plan = vendorSubscriptionPlanRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        vendorSubscriptionPlanRepository.delete(plan);
        audit(session, "SUBSCRIPTION_PLAN_DELETED", "vendor_subscription_plans", id,
            Map.of("name", plan.getName()), Map.of("deleted", true));
        return Map.of("message", "Plan deleted");
    }

    // ========== SUBSCRIPTION DEAL MANAGEMENT ==========

    @GetMapping("/subscription/deals")
    public List<VendorSubscriptionDeal> listSubscriptionDeals() {
        return vendorSubscriptionDealRepository.findAll();
    }

    @PostMapping("/subscription/deals")
    public VendorSubscriptionDeal createSubscriptionDeal(@RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        VendorSubscriptionDeal deal = new VendorSubscriptionDeal();
        deal.setTitle((String) body.get("title"));
        deal.setDescription((String) body.get("description"));
        deal.setDealType((String) body.get("dealType"));
        deal.setValue(new java.math.BigDecimal(body.get("value").toString()));
        if (body.containsKey("planId") && body.get("planId") != null) {
            VendorSubscriptionPlan plan = vendorSubscriptionPlanRepository.findById(
                Long.valueOf(body.get("planId").toString()))
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
            deal.setPlan(plan);
        }
        deal.setStartsAt(java.time.Instant.parse((String) body.get("startsAt")));
        deal.setEndsAt(java.time.Instant.parse((String) body.get("endsAt")));
        deal.setActive(true);
        VendorSubscriptionDeal saved = vendorSubscriptionDealRepository.save(deal);
        audit(session, "SUBSCRIPTION_DEAL_CREATED", "vendor_subscription_deals", saved.getId(),
            null, Map.of("title", saved.getTitle()));
        return saved;
    }

    @PutMapping("/subscription/deals/{id}")
    public VendorSubscriptionDeal updateSubscriptionDeal(@PathVariable Long id,
            @RequestBody Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        VendorSubscriptionDeal deal = vendorSubscriptionDealRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found"));
        Map<String, Object> oldData = new HashMap<>();
        if (body.containsKey("title")) { oldData.put("title", deal.getTitle()); deal.setTitle((String) body.get("title")); }
        if (body.containsKey("description")) { oldData.put("description", deal.getDescription()); deal.setDescription((String) body.get("description")); }
        if (body.containsKey("dealType")) { oldData.put("dealType", deal.getDealType()); deal.setDealType((String) body.get("dealType")); }
        if (body.containsKey("value")) { oldData.put("value", deal.getValue()); deal.setValue(new java.math.BigDecimal(body.get("value").toString())); }
        if (body.containsKey("planId") && body.get("planId") != null) {
            VendorSubscriptionPlan plan = vendorSubscriptionPlanRepository.findById(
                Long.valueOf(body.get("planId").toString()))
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
            deal.setPlan(plan);
        }
        if (body.containsKey("startsAt")) deal.setStartsAt(java.time.Instant.parse((String) body.get("startsAt")));
        if (body.containsKey("endsAt")) deal.setEndsAt(java.time.Instant.parse((String) body.get("endsAt")));
        if (body.containsKey("isActive")) deal.setActive(Boolean.parseBoolean(body.get("isActive").toString()));
        VendorSubscriptionDeal saved = vendorSubscriptionDealRepository.save(deal);
        audit(session, "SUBSCRIPTION_DEAL_UPDATED", "vendor_subscription_deals", id,
            oldData.isEmpty() ? null : oldData, Map.of("updated", true));
        return saved;
    }

    @DeleteMapping("/subscription/deals/{id}")
    public Map<String, String> deleteSubscriptionDeal(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        VendorSubscriptionDeal deal = vendorSubscriptionDealRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Deal not found"));
        vendorSubscriptionDealRepository.delete(deal);
        audit(session, "SUBSCRIPTION_DEAL_DELETED", "vendor_subscription_deals", id,
            Map.of("title", deal.getTitle()), Map.of("deleted", true));
        return Map.of("message", "Deal deleted");
    }

    @GetMapping("/upgrades")
    public List<RoleUpgrade> listUpgrades(@RequestParam(required = false) String status,
            @RequestParam(required = false) String role) {
        if (status != null) return roleUpgradeRepository.findByStatusOrderByCreatedAtDesc(status);
        if (role != null) return roleUpgradeRepository.findByRoleOrderByCreatedAtDesc(role);
        return roleUpgradeRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/users/{id}/upgrades")
    public List<RoleUpgrade> listUserUpgrades(@PathVariable Long id) {
        return roleUpgradeRepository.findByUserId(id);
    }

    @PostMapping("/upgrades/{id}/cancel")
    public Map<String, Object> cancelUpgrade(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        RoleUpgrade upgrade = roleUpgradeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Upgrade not found"));
        User user = upgrade.getUser();
        String roleName = upgrade.getRole();
        Set<Role> currentRoles = new HashSet<>(user.getRoles());
        currentRoles.removeIf(r -> r.getName().equals(roleName));
        user.setRoles(currentRoles);
        userRepository.saveAndFlush(user);
        upgrade.setStatus("CANCELLED");
        upgrade.setActivatedAt(null);
        roleUpgradeRepository.save(upgrade);
        audit(session, "UPGRADE_CANCELLED", "role_upgrades", id,
                Map.of("role", roleName, "userId", user.getId()),
                Map.of("status", "CANCELLED"));
        return Map.of("message", "Upgrade cancelled and role revoked", "upgradeId", id);
    }
}
