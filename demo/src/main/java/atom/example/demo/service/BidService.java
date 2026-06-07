package atom.example.demo.service;

import atom.example.demo.model.AuctionLot;
import atom.example.demo.model.Bid;
import atom.example.demo.model.BidderReputation;
import atom.example.demo.model.Notification;
import atom.example.demo.model.User;
import atom.example.demo.repository.AuctionLotRepository;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.BidRepository;
import atom.example.demo.repository.BidderReputationRepository;
import atom.example.demo.repository.NotificationRepository;
import atom.example.demo.repository.UserAgreementRepository;
import atom.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class BidService {

    private final BidRepository bidRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final BidderReputationRepository bidderReputationRepository;
    private final UserAgreementRepository userAgreementRepository;
    private final UserRepository userRepository;
    private final AuctionRepository auctionRepository;
    private final NotificationRepository notificationRepository;
    private final AuctionRealtimeService auctionRealtimeService;

    public BidService(BidRepository bidRepository, AuctionLotRepository auctionLotRepository,
                       BidderReputationRepository bidderReputationRepository,
                       UserAgreementRepository userAgreementRepository,
                       UserRepository userRepository,
                       AuctionRepository auctionRepository,
                       NotificationRepository notificationRepository,
                       AuctionRealtimeService auctionRealtimeService) {
        this.bidRepository = bidRepository;
        this.auctionLotRepository = auctionLotRepository;
        this.bidderReputationRepository = bidderReputationRepository;
        this.userAgreementRepository = userAgreementRepository;
        this.userRepository = userRepository;
        this.auctionRepository = auctionRepository;
        this.notificationRepository = notificationRepository;
        this.auctionRealtimeService = auctionRealtimeService;
    }

    @Transactional
    public Bid placeBid(Long lotId, Long bidderId, BigDecimal amountBdt) {
        if (amountBdt == null || amountBdt.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Bid amount must be greater than zero");

        AuctionLot lot = auctionLotRepository.findByIdForUpdate(lotId)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found"));

        // 1. Auction and lot must be ACTIVE.
        if (lot.getAuction() == null || !"ACTIVE".equals(lot.getAuction().getStatus()))
            throw new IllegalArgumentException("Auction is not accepting bids");
        if (!"ACTIVE".equals(lot.getStatus()))
            throw new IllegalArgumentException("Lot is not accepting bids");

        // 2. Vendor cannot bid on own auction
        if (lot.getAuction() != null && lot.getAuction().getVendor() != null
                && lot.getAuction().getVendor().getId().equals(bidderId))
            throw new IllegalArgumentException("You cannot bid on your own auction");

        // 3. Bidder must accept auction rules before participating.
        if (!userAgreementRepository.existsByUserIdAndAgreementType(bidderId, "AUCTION_RULES"))
            throw new IllegalArgumentException("You must accept the auction rules before bidding");

        User bidder = userRepository.findById(bidderId)
                .orElseThrow(() -> new IllegalArgumentException("Bidder not found"));
        if (!"ACTIVE".equals(bidder.getStatus()))
            throw new IllegalArgumentException("Your account is not eligible to bid");

        Optional<Bid> topBid = bidRepository.findTopByLotIdOrderByAmountBdtDesc(lotId);
        if (topBid.isPresent() && topBid.get().getBidder() != null
                && topBid.get().getBidder().getId().equals(bidderId)) {
            throw new IllegalArgumentException("You are already the highest bidder");
        }

        // 5. Validate minimum bid increment after the pessimistic lock to reject stale race bids.
        BigDecimal current = lot.getCurrentBidBdt();
        BigDecimal base = (current == null || current.compareTo(BigDecimal.ZERO) <= 0)
            ? lot.getStartingPriceBdt()
            : current;
        BigDecimal minBid = base.add(lot.getMinBidIncrementBdt());
        if (amountBdt.compareTo(minBid) < 0)
            throw new IllegalArgumentException("Bid must be at least " + minBid);
        boolean alreadyEntered = bidRepository.existsByLotIdAndBidderId(lotId, bidderId);

        // 6. Create bid
        Bid bid = new Bid();
        bid.setLot(lot);
        bid.setBidder(bidder);
        bid.setAmountBdt(amountBdt);
        bid.setWinning(true);
        bid.setCreatedAt(Instant.now());

        // 7. Flip previous winning bid and notify the outbid bidder.
        topBid.ifPresent(b -> {
            b.setWinning(false);
            bidRepository.save(b);
            notifyOutbidBidder(b, amountBdt, lot);
        });

        bid = bidRepository.save(bid);

        // 8. Update lot state and extend last-minute auctions to prevent bid sniping.
        lot.setCurrentBidBdt(amountBdt);
        maybeExtendAuction(lot);
        auctionLotRepository.save(lot);

        // 9. Update bidder reputation only once per lot entry.
        BidderReputation reputation = bidderReputationRepository.findByUserId(bidderId).orElse(null);
        if (reputation == null) {
            reputation = new BidderReputation();
            reputation.setUser(bidder);
        }
        if (!alreadyEntered) {
            reputation.setAuctionsEntered(reputation.getAuctionsEntered() + 1);
        }
        if (reputation.getAuctionsEntered() > 0) {
            BigDecimal winRate = BigDecimal.valueOf(reputation.getAuctionsWon())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(reputation.getAuctionsEntered()), 2, java.math.RoundingMode.HALF_UP);
            reputation.setWinRate(winRate);
        }
        bidderReputationRepository.save(reputation);

        auctionRealtimeService.broadcastLot(lot, bid, "bid_placed");

        return bid;
    }

    private void maybeExtendAuction(AuctionLot lot) {
        if (lot.getAuction() == null || lot.getAuction().getEndTime() == null) return;
        if (lot.getExtensionDurationMinutes() <= 0 || lot.getExtensionsCount() >= lot.getMaxExtensions()) return;
        Instant now = Instant.now();
        Instant endTime = lot.getAuction().getEndTime();
        long secondsLeft = Duration.between(now, endTime).getSeconds();
        long extensionWindowSeconds = lot.getExtensionDurationMinutes() * 60L;
        if (secondsLeft >= 0 && secondsLeft <= extensionWindowSeconds) {
            lot.getAuction().setEndTime(endTime.plus(Duration.ofMinutes(lot.getExtensionDurationMinutes())));
            lot.setExtensionsCount(lot.getExtensionsCount() + 1);
            auctionRepository.save(lot.getAuction());
        }
    }

    private void notifyOutbidBidder(Bid previousBid, BigDecimal newAmount, AuctionLot lot) {
        if (previousBid.getBidder() == null) return;
        Notification notification = new Notification();
        notification.setUser(previousBid.getBidder());
        notification.setType("AUCTION_OUTBID");
        notification.setTitle("You were outbid");
        notification.setBody("A new bid of BDT " + newAmount + " was placed on \"" + lot.getTitle() + "\".");
        notification.setEntityType("auction_lot");
        notification.setEntityId(lot.getId());
        notificationRepository.save(notification);
    }

    public List<Bid> getLotBids(Long lotId) {
        return bidRepository.findByLotIdOrderByCreatedAtDesc(lotId);
    }

    public Optional<Bid> getWinningBid(Long lotId) {
        return bidRepository.findTopByLotIdOrderByAmountBdtDesc(lotId);
    }

    public List<Bid> getBidderBids(Long bidderId) {
        return bidRepository.findByBidderId(bidderId);
    }
}
