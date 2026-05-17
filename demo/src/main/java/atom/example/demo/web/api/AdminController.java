package atom.example.demo.web.api;

import atom.example.demo.model.AnalyticsSnapshot;
import atom.example.demo.model.Auction;
import atom.example.demo.model.AuditLog;
import atom.example.demo.model.FraudFlag;
import atom.example.demo.model.PlatformSetting;
import atom.example.demo.model.Report;
import atom.example.demo.model.Return;
import atom.example.demo.model.SystemNotification;
import atom.example.demo.model.User;
import atom.example.demo.model.VendorProfile;
import atom.example.demo.repository.AnalyticsSnapshotRepository;
import atom.example.demo.repository.AuctionApprovalRepository;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.AuditLogRepository;
import atom.example.demo.repository.FraudFlagRepository;
import atom.example.demo.repository.PlatformSettingRepository;
import atom.example.demo.repository.ReportRepository;
import atom.example.demo.repository.ReturnRepository;
import atom.example.demo.repository.SystemNotificationRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorProfileRepository;
import jakarta.servlet.http.HttpSession;
import java.time.Instant;
import java.util.List;
import java.util.Map;
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

    private final UserRepository userRepository;
    private final AuctionRepository auctionRepository;
    private final FraudFlagRepository fraudFlagRepository;
    private final ReportRepository reportRepository;
    private final ReturnRepository returnRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final AuditLogRepository auditLogRepository;
    private final AnalyticsSnapshotRepository analyticsSnapshotRepository;
    private final SystemNotificationRepository systemNotificationRepository;
    private final VendorProfileRepository vendorProfileRepository;
    private final AuctionApprovalRepository auctionApprovalRepository;

    public AdminController(UserRepository userRepository, AuctionRepository auctionRepository,
            FraudFlagRepository fraudFlagRepository, ReportRepository reportRepository,
            ReturnRepository returnRepository, PlatformSettingRepository platformSettingRepository,
            AuditLogRepository auditLogRepository,
            AnalyticsSnapshotRepository analyticsSnapshotRepository,
            SystemNotificationRepository systemNotificationRepository,
            VendorProfileRepository vendorProfileRepository,
            AuctionApprovalRepository auctionApprovalRepository) {
        this.userRepository = userRepository;
        this.auctionRepository = auctionRepository;
        this.fraudFlagRepository = fraudFlagRepository;
        this.reportRepository = reportRepository;
        this.returnRepository = returnRepository;
        this.platformSettingRepository = platformSettingRepository;
        this.auditLogRepository = auditLogRepository;
        this.analyticsSnapshotRepository = analyticsSnapshotRepository;
        this.systemNotificationRepository = systemNotificationRepository;
        this.vendorProfileRepository = vendorProfileRepository;
        this.auctionApprovalRepository = auctionApprovalRepository;
    }

    private void requireAuth(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
    }

    private Long getUserId(HttpSession session) {
        return (Long) session.getAttribute("userId");
    }

    @GetMapping("/users")
    public List<User> listUsers(@RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        return userRepository.findAll().stream()
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
    public User banUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus("BANNED");
        return userRepository.save(user);
    }

    @PutMapping("/users/{id}/unban")
    public User unbanUser(@PathVariable Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus("ACTIVE");
        return userRepository.save(user);
    }

    @GetMapping("/auctions")
    public List<Auction> listAuctions(@RequestParam(required = false) String status) {
        if (status != null) return auctionRepository.findByStatus(status);
        return auctionRepository.findAll();
    }

    @GetMapping("/auctions/pending")
    public List<Auction> pendingAuctions() {
        return auctionRepository.findByStatus("CREATED");
    }

    @PutMapping("/auctions/{id}/approve")
    public Auction approveAuction(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Auction auction = auctionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        auction.setStatus("APPROVED");
        return auctionRepository.save(auction);
    }

    @PutMapping("/auctions/{id}/reject")
    public Auction rejectAuction(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpSession session) {
        requireAuth(session);
        Auction auction = auctionRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        auction.setStatus("REJECTED");
        return auctionRepository.save(auction);
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
        flag.setStatus("RESOLVED");
        flag.setResolvedAt(Instant.now());
        return fraudFlagRepository.save(flag);
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
        report.setStatus("RESOLVED");
        report.setResolvedAt(Instant.now());
        if (body != null && body.containsKey("adminNote")) report.setAdminNote((String) body.get("adminNote"));
        return reportRepository.save(report);
    }

    @PutMapping("/reports/{id}/dismiss")
    public Report dismissReport(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Report report = reportRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Report not found"));
        report.setStatus("DISMISSED");
        report.setResolvedAt(Instant.now());
        return reportRepository.save(report);
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
        returnRequest.setStatus("APPROVED");
        returnRequest.setResolvedAt(Instant.now());
        return returnRepository.save(returnRequest);
    }

    @PutMapping("/returns/{id}/reject")
    public Return rejectReturn(@PathVariable Long id, HttpSession session) {
        requireAuth(session);
        Return returnRequest = returnRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Return not found"));
        returnRequest.setStatus("REJECTED");
        returnRequest.setResolvedAt(Instant.now());
        return returnRepository.save(returnRequest);
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
        setting.setValue((String) body.get("value"));
        User admin = userRepository.findById(getUserId(session)).orElse(null);
        setting.setUpdatedBy(admin);
        return platformSettingRepository.save(setting);
    }

    @GetMapping("/audit-logs")
    public List<AuditLog> listAuditLogs(@RequestParam(required = false) Long actor,
            @RequestParam(required = false) String entityType) {
        if (actor != null) return auditLogRepository.findByActorId(actor);
        return auditLogRepository.findAll();
    }

    @GetMapping("/analytics/dashboard")
    public Map<String, Object> analyticsDashboard() {
        List<AnalyticsSnapshot> snapshots = analyticsSnapshotRepository.findAllByOrderBySnapshotDateDesc();
        AnalyticsSnapshot latest = snapshots.isEmpty() ? null : snapshots.get(0);
        long totalUsers = userRepository.count();
        return Map.of(
                "totalUsers", totalUsers,
                "latestSnapshot", latest,
                "totalAuctions", auctionRepository.count()
        );
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
        return systemNotificationRepository.save(notif);
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
        return systemNotificationRepository.save(notif);
    }

    @DeleteMapping("/system-notifications/{id}")
    public Map<String, String> deleteSystemNotification(@PathVariable Long id) {
        systemNotificationRepository.deleteById(id);
        return Map.of("message", "Deleted");
    }

    @GetMapping("/vendors")
    public List<VendorProfile> listVendors() {
        return vendorProfileRepository.findAll();
    }

    @PutMapping("/vendors/{id}/verify")
    public VendorProfile verifyVendor(@PathVariable Long id) {
        VendorProfile profile = vendorProfileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Vendor profile not found"));
        profile.setVerificationStatus("VERIFIED");
        return vendorProfileRepository.save(profile);
    }
}
