package atom.example.demo.service;

import atom.example.demo.model.AuctionLot;
import atom.example.demo.model.AuctionWinner;
import atom.example.demo.model.Bid;
import atom.example.demo.model.BidderReputation;
import atom.example.demo.model.Notification;
import atom.example.demo.model.User;
import atom.example.demo.repository.AuctionLotRepository;
import atom.example.demo.repository.AuctionWinnerRepository;
import atom.example.demo.repository.BidRepository;
import atom.example.demo.repository.BidderReputationRepository;
import atom.example.demo.repository.NotificationRepository;
import atom.example.demo.repository.PlatformSettingRepository;
import atom.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

@Service
public class WinnerService {

    private final AuctionLotRepository auctionLotRepository;
    private final AuctionWinnerRepository auctionWinnerRepository;
    private final BidRepository bidRepository;
    private final BidderReputationRepository bidderReputationRepository;
    private final NotificationRepository notificationRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final UserRepository userRepository;

    public WinnerService(AuctionLotRepository auctionLotRepository,
                         AuctionWinnerRepository auctionWinnerRepository,
                         BidRepository bidRepository,
                         BidderReputationRepository bidderReputationRepository,
                         NotificationRepository notificationRepository,
                         PlatformSettingRepository platformSettingRepository,
                         UserRepository userRepository) {
        this.auctionLotRepository = auctionLotRepository;
        this.auctionWinnerRepository = auctionWinnerRepository;
        this.bidRepository = bidRepository;
        this.bidderReputationRepository = bidderReputationRepository;
        this.notificationRepository = notificationRepository;
        this.platformSettingRepository = platformSettingRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AuctionWinner determineWinner(Long lotId) {
        AuctionLot lot = auctionLotRepository.findById(lotId)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found"));

        if (!"CLOSED".equals(lot.getStatus()))
            throw new IllegalArgumentException("Lot must be CLOSED to determine winner");

        Optional<AuctionWinner> existing = auctionWinnerRepository.findByLotId(lotId);
        if (existing.isPresent())
            return existing.get();

        Optional<Bid> topBid = bidRepository.findTopByLotIdOrderByAmountBdtDesc(lotId);
        if (topBid.isEmpty())
            throw new IllegalArgumentException("No bids to determine winner");

        Bid winningBid = topBid.get();
        User winner = winningBid.getBidder();

        boolean reserveMet = true;
        if (lot.getReservePriceBdt() != null && lot.getReservePriceBdt().compareTo(BigDecimal.ZERO) > 0) {
            reserveMet = winningBid.getAmountBdt().compareTo(lot.getReservePriceBdt()) >= 0;
        }

        int paymentDeadlineHours = 48;
        try {
            String val = platformSettingRepository.findById("auction.payment_deadline_hours")
                    .map(s -> s.getValue()).orElse("48");
            paymentDeadlineHours = Integer.parseInt(val);
        } catch (Exception ignored) {}

        AuctionWinner auctionWinner = new AuctionWinner();
        auctionWinner.setLot(lot);
        auctionWinner.setWinner(winner);
        auctionWinner.setWinningBid(winningBid);
        auctionWinner.setFinalPriceBdt(winningBid.getAmountBdt());
        auctionWinner.setReserveMet(reserveMet);
        auctionWinner.setPaymentDeadline(Instant.now().plusSeconds(paymentDeadlineHours * 3600L));
        auctionWinner = auctionWinnerRepository.save(auctionWinner);

        // Update bidder reputation
        BidderReputation reputation = bidderReputationRepository.findByUserId(winner.getId()).orElse(null);
        if (reputation == null) {
            reputation = new BidderReputation();
            reputation.setUser(winner);
        }
        reputation.setAuctionsWon(reputation.getAuctionsWon() + 1);
        if (reputation.getAuctionsEntered() > 0) {
            BigDecimal winRate = BigDecimal.valueOf(reputation.getAuctionsWon())
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(reputation.getAuctionsEntered()), 2, java.math.RoundingMode.HALF_UP);
            reputation.setWinRate(winRate);
        }
        bidderReputationRepository.save(reputation);

        // Notify winner
        Notification notif = new Notification();
        notif.setUser(winner);
        notif.setType("AUCTION_WON");
        notif.setTitle("You won an auction!");
        notif.setBody("You won lot \"" + lot.getTitle() + "\" for ৳" + winningBid.getAmountBdt()
                + ". Please pay by " + auctionWinner.getPaymentDeadline() + ".");
        notif.setEntityType("auction_lot");
        notif.setEntityId(lot.getId());
        notificationRepository.save(notif);

        return auctionWinner;
    }

    @Transactional
    public void handleNonPayment(Long winnerId, Long lotId) {
        AuctionWinner winner = auctionWinnerRepository.findByLotId(lotId)
                .orElseThrow(() -> new IllegalArgumentException("Winner entry not found"));
        winner.setPaymentStatus("FAILED");
        winner.setNonPaymentCount(winner.getNonPaymentCount() + 1);
        auctionWinnerRepository.save(winner);

        // Check if bidder should be banned from bidding
        int maxNonPayment = 2;
        try {
            String val = platformSettingRepository.findById("auction.nonpayment_ban_count")
                    .map(s -> s.getValue()).orElse("2");
            maxNonPayment = Integer.parseInt(val);
        } catch (Exception ignored) {}

        if (winner.getNonPaymentCount() >= maxNonPayment) {
            // Notify about potential restriction
            User bidder = userRepository.findById(winnerId).orElse(null);
            if (bidder != null) {
                Notification notif = new Notification();
                notif.setUser(bidder);
                notif.setType("AUCTION_BAN_WARNING");
                notif.setTitle("Non-payment warning");
                notif.setBody("You have failed to pay for " + winner.getNonPaymentCount()
                        + " auction wins. Further non-payment may result in a bidding ban.");
                notif.setEntityType("auction_winner");
                notif.setEntityId(winner.getId());
                notificationRepository.save(notif);
            }
        }
    }
}
