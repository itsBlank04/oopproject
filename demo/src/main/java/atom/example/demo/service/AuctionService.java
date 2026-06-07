package atom.example.demo.service;

import atom.example.demo.model.Auction;
import atom.example.demo.model.AuctionApproval;
import atom.example.demo.model.AuctionLot;
import atom.example.demo.model.AuctionStatusLog;
import atom.example.demo.model.User;
import atom.example.demo.repository.AuctionApprovalRepository;
import atom.example.demo.repository.AuctionLotRepository;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.AuctionStatusLogRepository;
import atom.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class AuctionService {

    private static final Set<String> PUBLIC_STATUSES = Set.of("PREPARING", "ACTIVE", "CLOSED");

    private final AuctionRepository auctionRepository;
    private final AuctionApprovalRepository auctionApprovalRepository;
    private final AuctionStatusLogRepository auctionStatusLogRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final UserRepository userRepository;
    private final AuctionRealtimeService auctionRealtimeService;

    public AuctionService(AuctionRepository auctionRepository,
                            AuctionApprovalRepository auctionApprovalRepository,
                            AuctionStatusLogRepository auctionStatusLogRepository,
                            AuctionLotRepository auctionLotRepository,
                            UserRepository userRepository,
                            AuctionRealtimeService auctionRealtimeService) {
        this.auctionRepository = auctionRepository;
        this.auctionApprovalRepository = auctionApprovalRepository;
        this.auctionStatusLogRepository = auctionStatusLogRepository;
        this.auctionLotRepository = auctionLotRepository;
        this.userRepository = userRepository;
        this.auctionRealtimeService = auctionRealtimeService;
    }

    @Transactional
    public Auction createAuction(Long vendorId, String title, String type,
                                   Integer preparationDurationMinutes, Integer activeDurationMinutes,
                                   boolean termsAccepted) {
        User vendor = userRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));
        Auction auction = new Auction();
        auction.setVendor(vendor);
        auction.setTitle(title);
        auction.setType(type);
        auction.setStatus("CREATED");
        auction.setPreparationDurationMinutes(validatePreparationDuration(preparationDurationMinutes));
        auction.setActiveDurationMinutes(validateActiveDuration(activeDurationMinutes));
        auction.setTermsAccepted(termsAccepted);
        auction = auctionRepository.save(auction);
        logStatusChange(auction, null, "CREATED", vendorId);
        return auction;
    }

    @Transactional
    public Auction updateAuction(Long auctionId, Long userId, String title, String type,
                                   Integer preparationDurationMinutes, Integer activeDurationMinutes,
                                   Boolean termsAccepted) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (!auction.getVendor().getId().equals(userId))
            throw new IllegalArgumentException("Not your auction");
        if (!"CREATED".equals(auction.getStatus()))
            throw new IllegalArgumentException("Can only edit CREATED auctions");
        if (title != null) auction.setTitle(title);
        if (type != null) auction.setType(type);
        if (preparationDurationMinutes != null) auction.setPreparationDurationMinutes(validatePreparationDuration(preparationDurationMinutes));
        if (activeDurationMinutes != null) auction.setActiveDurationMinutes(validateActiveDuration(activeDurationMinutes));
        if (termsAccepted != null) auction.setTermsAccepted(termsAccepted);
        return auctionRepository.save(auction);
    }

    @Transactional
    public void deleteAuction(Long auctionId, Long userId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (!auction.getVendor().getId().equals(userId))
            throw new IllegalArgumentException("Not your auction");
        if (!"CREATED".equals(auction.getStatus()))
            throw new IllegalArgumentException("Can only delete CREATED auctions");
        auctionRepository.delete(auction);
    }

    @Transactional
    public Auction approveAuction(Long auctionId, Long adminId, String notes) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (!"CREATED".equals(auction.getStatus()))
            throw new IllegalArgumentException("Can only approve CREATED auctions");
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        String oldStatus = auction.getStatus();
        auction.setStatus("APPROVED");
        auction = auctionRepository.save(auction);
        AuctionApproval approval = new AuctionApproval();
        approval.setAuction(auction);
        approval.setAdmin(admin);
        approval.setStatus("APPROVED");
        approval.setNotes(notes);
        approval.setDecidedAt(Instant.now());
        auctionApprovalRepository.save(approval);
        logStatusChange(auction, oldStatus, "APPROVED", adminId);
        return auction;
    }

    @Transactional
    public Auction rejectAuction(Long auctionId, Long adminId, String notes) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (!"CREATED".equals(auction.getStatus()))
            throw new IllegalArgumentException("Can only reject CREATED auctions");
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        String oldStatus = auction.getStatus();
        auction.setStatus("REJECTED");
        auction = auctionRepository.save(auction);
        AuctionApproval approval = new AuctionApproval();
        approval.setAuction(auction);
        approval.setAdmin(admin);
        approval.setStatus("REJECTED");
        approval.setNotes(notes);
        approval.setDecidedAt(Instant.now());
        auctionApprovalRepository.save(approval);
        logStatusChange(auction, oldStatus, "REJECTED", adminId);
        return auction;
    }

    @Transactional
    public Auction updateStatus(Long auctionId, String newStatus, Long changedBy) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        String oldStatus = auction.getStatus();
        auction.setStatus(newStatus);
        auction = auctionRepository.save(auction);
        logStatusChange(auction, oldStatus, newStatus, changedBy);
        auctionRealtimeService.broadcastAuction(auction, "auction_status_changed");
        return auction;
    }

    @Transactional
    public Auction publishAuction(Long auctionId, Long vendorId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (!auction.getVendor().getId().equals(vendorId))
            throw new IllegalArgumentException("Not your auction");
        if (!"CREATED".equals(auction.getStatus()))
            throw new IllegalArgumentException("Only draft auctions can be published");
        if (!auction.isTermsAccepted())
            throw new IllegalArgumentException("Auction terms must be accepted before publishing");
        int preparationMinutes = validatePreparationDuration(auction.getPreparationDurationMinutes());
        int activeMinutes = validateActiveDuration(auction.getActiveDurationMinutes());

        List<AuctionLot> lots = auctionLotRepository.findByAuctionId(auctionId);
        if (lots.isEmpty())
            throw new IllegalArgumentException("Add at least one lot before publishing");

        String oldStatus = auction.getStatus();
        Instant now = Instant.now();
        Instant activeAt = now.plus(Duration.ofMinutes(preparationMinutes));
        Instant closesAt = activeAt.plus(Duration.ofMinutes(activeMinutes));
        String newStatus = preparationMinutes == 0 ? "ACTIVE" : "PREPARING";
        auction.setStartTime(activeAt);
        auction.setEndTime(closesAt);
        auction.setStatus(newStatus);
        auction = auctionRepository.save(auction);

        for (AuctionLot lot : lots) {
            lot.setStatus(newStatus);
            auctionLotRepository.save(lot);
        }

        logStatusChange(auction, oldStatus, newStatus, vendorId);
        auctionRealtimeService.broadcastAuction(auction, "auction_published");
        return auction;
    }

    private void logStatusChange(Auction auction, String oldStatus, String newStatus, Long changedBy) {
        AuctionStatusLog log = new AuctionStatusLog();
        log.setAuction(auction);
        log.setOldStatus(oldStatus != null ? oldStatus : newStatus);
        log.setNewStatus(newStatus);
        if (changedBy != null) {
            userRepository.findById(changedBy).ifPresent(log::setChangedBy);
        }
        log.setChangedAt(Instant.now());
        auctionStatusLogRepository.save(log);
    }

    public List<Auction> listAuctions(String status, String type) {
        if (status != null && !PUBLIC_STATUSES.contains(status)) return List.of();
        if (status != null && type != null) return auctionRepository.findByStatusAndType(status, type);
        if (status != null) return auctionRepository.findByStatus(status);
        return auctionRepository.findAll().stream()
                .filter(a -> PUBLIC_STATUSES.contains(a.getStatus()))
                .toList();
    }

    private int validatePreparationDuration(Integer minutes) {
        int value = minutes == null ? 10 : minutes;
        if (value < 0) throw new IllegalArgumentException("Preparation duration must be zero or more minutes");
        return value;
    }

    private int validateActiveDuration(Integer minutes) {
        int value = minutes == null ? 60 : minutes;
        if (value <= 0) throw new IllegalArgumentException("Active duration must be at least one minute");
        return value;
    }

    public Auction getAuction(Long id) {
        return auctionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
    }

    public List<Auction> getVendorAuctions(Long vendorId) {
        return auctionRepository.findByVendorId(vendorId);
    }

    public List<Auction> getPendingAuctions() {
        return auctionRepository.findByStatus("CREATED");
    }
}
