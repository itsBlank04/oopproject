package atom.example.demo.scheduler;

import atom.example.demo.model.Auction;
import atom.example.demo.model.AuctionLot;
import atom.example.demo.repository.AuctionLotRepository;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.service.AuctionRealtimeService;
import atom.example.demo.service.AuctionService;
import atom.example.demo.service.WinnerService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
public class AuctionScheduler {

    private final AuctionRepository auctionRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final AuctionService auctionService;
    private final WinnerService winnerService;
    private final AuctionRealtimeService auctionRealtimeService;

    public AuctionScheduler(AuctionRepository auctionRepository,
                             AuctionLotRepository auctionLotRepository,
                             AuctionService auctionService,
                             WinnerService winnerService,
                             AuctionRealtimeService auctionRealtimeService) {
        this.auctionRepository = auctionRepository;
        this.auctionLotRepository = auctionLotRepository;
        this.auctionService = auctionService;
        this.winnerService = winnerService;
        this.auctionRealtimeService = auctionRealtimeService;
    }

    @Scheduled(fixedRate = 2_000)
    @Transactional
    public void openScheduledAuctions() {
        Instant now = Instant.now();
        List<Auction> toOpen = auctionRepository.findByStatusAndStartTimeBefore("PREPARING", now);
        for (Auction auction : toOpen) {
            auction.setStatus("ACTIVE");
            auctionRepository.save(auction);
            List<AuctionLot> lots = auctionLotRepository.findByAuctionId(auction.getId());
            for (AuctionLot lot : lots) {
                lot.setStatus("ACTIVE");
                auctionLotRepository.save(lot);
            }
            auctionRealtimeService.broadcastAuction(auction, "auction_opened");
        }
    }

    @Scheduled(fixedRate = 2_000)
    public void closeExpiredAuctions() {
        Instant now = Instant.now();
        List<Auction> activeAuctions = auctionRepository.findByStatus("ACTIVE");
        for (Auction auction : activeAuctions) {
            if (auction.getEndTime() != null && auction.getEndTime().isBefore(now)) {
                List<AuctionLot> lots = auctionLotRepository.findByAuctionId(auction.getId());
                for (AuctionLot lot : lots) {
                    if ("ACTIVE".equals(lot.getStatus())) {
                        lot.setStatus("CLOSED");
                        auctionLotRepository.save(lot);
                        try {
                            winnerService.determineWinner(lot.getId());
                        } catch (Exception e) {
                            // Log but continue — lot may have no bids
                        }
                    }
                }
                auction.setStatus("CLOSED");
                auctionRepository.save(auction);
                auctionRealtimeService.broadcastAuction(auction, "auction_closed");
            }
        }
    }
}
