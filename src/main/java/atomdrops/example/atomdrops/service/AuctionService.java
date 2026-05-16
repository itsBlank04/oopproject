package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Auction;
import atomdrops.example.atomdrops.model.AuctionImage;
import atomdrops.example.atomdrops.model.AuctionLot;
import atomdrops.example.atomdrops.model.Bid;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.enums.AgreementType;
import atomdrops.example.atomdrops.model.enums.AuctionStatus;
import atomdrops.example.atomdrops.model.enums.AuctionType;
import atomdrops.example.atomdrops.model.enums.LotStatus;
import atomdrops.example.atomdrops.repository.AuctionImageRepository;
import atomdrops.example.atomdrops.repository.AuctionLotRepository;
import atomdrops.example.atomdrops.repository.AuctionRepository;
import atomdrops.example.atomdrops.repository.BidRepository;
import atomdrops.example.atomdrops.repository.BidderRestrictionRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import atomdrops.example.atomdrops.web.dto.AuctionLotResponse;
import atomdrops.example.atomdrops.web.dto.AuctionResponse;
import atomdrops.example.atomdrops.web.dto.AuctionSummaryResponse;
import atomdrops.example.atomdrops.web.dto.BidResponse;
import atomdrops.example.atomdrops.web.dto.CreateAuctionRequest;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuctionService {

    private final AuctionRepository auctionRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final AuctionImageRepository auctionImageRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;
    private final AuctionPublisher auctionPublisher;
    private final BidderRestrictionRepository bidderRestrictionRepository;
    private final NotificationService notificationService;
    private final AgreementService agreementService;

    public AuctionService(
            AuctionRepository auctionRepository,
            AuctionLotRepository auctionLotRepository,
            AuctionImageRepository auctionImageRepository,
            BidRepository bidRepository,
            UserRepository userRepository,
            AuctionPublisher auctionPublisher,
            BidderRestrictionRepository bidderRestrictionRepository,
            NotificationService notificationService,
            AgreementService agreementService) {
        this.auctionRepository = auctionRepository;
        this.auctionLotRepository = auctionLotRepository;
        this.auctionImageRepository = auctionImageRepository;
        this.bidRepository = bidRepository;
        this.userRepository = userRepository;
        this.auctionPublisher = auctionPublisher;
        this.bidderRestrictionRepository = bidderRestrictionRepository;
        this.notificationService = notificationService;
        this.agreementService = agreementService;
    }

    @Transactional(readOnly = true)
    public List<AuctionSummaryResponse> getAllAuctions() {
        return auctionRepository.findAll().stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public AuctionResponse getAuction(Long id) {
        Auction auction = auctionRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        AuctionResponse response = toResponse(auction);
        List<AuctionLot> lots = auctionLotRepository.findByAuction_Id(id);
        List<AuctionLotResponse> lotResponses = lots.stream()
            .map(this::toLotResponse)
            .toList();
        response.setLots(lotResponses);
        return response;
    }

    @Transactional(readOnly = true)
    public AuctionLotResponse getLot(Long lotId) {
        AuctionLot lot = auctionLotRepository.findById(lotId)
            .orElseThrow(() -> new IllegalArgumentException("Lot not found"));
        return toLotResponse(lot);
    }

    @Transactional(readOnly = true)
    public List<BidResponse> getBidsForLot(Long lotId) {
        return bidRepository.findByLot_IdOrderByAmountBdtDesc(lotId).stream()
            .map(this::toBidResponse)
            .toList();
    }

    public BidResponse placeBid(Long lotId, Long bidderId, BigDecimal amount) {
        AuctionLot lot = auctionLotRepository.findById(lotId)
            .orElseThrow(() -> new IllegalArgumentException("Lot not found"));
        User bidder = userRepository.findById(bidderId)
            .orElseThrow(() -> new IllegalArgumentException("Bidder not found"));

        if (lot.getAuction().getStatus() != AuctionStatus.ACTIVE) {
            throw new IllegalArgumentException("Auction is not active");
        }

        Long vendorId = lot.getAuction().getVendor().getId();
        if (bidderRestrictionRepository.findByVendor_IdAndBidder_Id(vendorId, bidderId).isPresent()) {
            throw new IllegalArgumentException("You have been restricted from bidding in this vendor's auctions");
        }

        if (!agreementService.hasAccepted(bidderId, AgreementType.AUCTION_RULES)) {
            throw new IllegalArgumentException("You must accept the auction rules before bidding");
        }

        BigDecimal min = lot.getCurrentBidBdt() != null
            ? lot.getCurrentBidBdt().max(lot.getStartingPriceBdt())
            : lot.getStartingPriceBdt();
        if (amount.compareTo(min) <= 0) {
            throw new IllegalArgumentException("Bid must be higher than current bid");
        }

        Bid bid = new Bid();
        bid.setLot(lot);
        bid.setBidder(bidder);
        bid.setAmountBdt(amount);
        bid = bidRepository.save(bid);

        lot.setCurrentBidBdt(amount);
        auctionLotRepository.save(lot);

        // Auto-extension: if bid within 2 minutes of endTime, extend by 2 minutes
        Auction auc = lot.getAuction();
        if (auc.getEndTime() != null) {
            long msUntilEnd = java.time.Duration.between(LocalDateTime.now(), auc.getEndTime()).toMillis();
            if (msUntilEnd > 0 && msUntilEnd < 120_000) {
                auc.setEndTime(auc.getEndTime().plusMinutes(2));
                if (auc.getStatus() == AuctionStatus.ACTIVE) {
                    auc.setStatus(AuctionStatus.EXTENDED);
                }
                auctionRepository.save(auc);
            }
        }

        BidResponse bidResponse = toBidResponse(bid);
        auctionPublisher.publishBid(lotId, bidResponse);
        auctionPublisher.publishLotUpdate(lotId, toLotResponse(lot));

        List<Bid> previousBids = bidRepository.findByLot_IdOrderByAmountBdtDesc(lotId);
        if (previousBids.size() > 1) {
            Bid previousTop = previousBids.get(1);
            if (!previousTop.getBidder().getId().equals(bidderId)) {
                try {
                    notificationService.create(previousTop.getBidder().getId(),
                        "You've been outbid!",
                        "Someone placed a higher bid of ৳" + amount + " on \"" + lot.getTitle() + "\"");
                } catch (Exception ignored) {}
            }
        }

        return bidResponse;
    }

    public AuctionLotResponse refreshLot(Long lotId) {
        AuctionLot lot = auctionLotRepository.findById(lotId)
            .orElseThrow(() -> new IllegalArgumentException("Lot not found"));
        return toLotResponse(lot);
    }

    public AuctionResponse createAuction(Long vendorId, CreateAuctionRequest req) {
        User vendor = userRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));

        Auction auction = new Auction();
        auction.setVendor(vendor);
        auction.setTitle(req.getTitle());
        auction.setType(AuctionType.valueOf(req.getType().toUpperCase()));
        auction.setStatus(AuctionStatus.CREATED);
        auction.setStartTime(LocalDateTime.parse(req.getStartTime()));
        auction.setEndTime(LocalDateTime.parse(req.getEndTime()));
        auction.setReservePriceBdt(req.getReservePriceBdt());
        auction = auctionRepository.save(auction);

        List<CreateAuctionRequest.LotRequest> lots = req.getLots();
        if (lots != null) {
            for (CreateAuctionRequest.LotRequest lr : lots) {
                AuctionLot lot = new AuctionLot();
                lot.setAuction(auction);
                lot.setTitle(lr.getTitle());
                lot.setDescription(lr.getDescription());
                lot.setStartingPriceBdt(lr.getStartingPriceBdt());
                lot.setCurrentBidBdt(lr.getStartingPriceBdt());
                lot.setStatus(LotStatus.PREPARING);
                lot = auctionLotRepository.save(lot);

                if (lr.getImageUrls() != null) {
                    for (String url : lr.getImageUrls()) {
                        AuctionImage img = new AuctionImage();
                        img.setLot(lot);
                        img.setImageUrl(url);
                        auctionImageRepository.save(img);
                    }
                }
            }
        }

        return getAuction(auction.getId());
    }

    public void approveAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
            .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        auction.setStatus(AuctionStatus.PREPARING);
        auctionRepository.save(auction);
    }

    public void activateAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
            .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (auction.getStatus() != AuctionStatus.PREPARING) {
            throw new IllegalArgumentException("Auction must be in PREPARING status to activate");
        }
        auction.setStatus(AuctionStatus.ACTIVE);
        auctionRepository.save(auction);
    }

    public void closeAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
            .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (auction.getStatus() != AuctionStatus.ACTIVE && auction.getStatus() != AuctionStatus.EXTENDED) {
            throw new IllegalArgumentException("Auction must be ACTIVE or EXTENDED to close");
        }
        auction.setStatus(AuctionStatus.CLOSED);
        auctionRepository.save(auction);
    }

    public void completeAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
            .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (auction.getStatus() != AuctionStatus.CLOSED) {
            throw new IllegalArgumentException("Auction must be CLOSED to complete");
        }
        auction.setStatus(AuctionStatus.COMPLETED);
        auctionRepository.save(auction);
    }

    public void rejectAuction(Long auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
            .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        auction.setStatus(AuctionStatus.CLOSED);
        auctionRepository.save(auction);
    }

    public AuctionResponse updateAuction(Long auctionId, Long vendorId, CreateAuctionRequest req) {
        Auction auction = auctionRepository.findById(auctionId)
            .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (auction.getStatus() != AuctionStatus.CREATED) {
            throw new IllegalArgumentException("Can only edit auctions in CREATED status");
        }
        if (!auction.getVendor().getId().equals(vendorId)) {
            throw new IllegalArgumentException("You do not own this auction");
        }

        auction.setTitle(req.getTitle());
        auction.setType(AuctionType.valueOf(req.getType().toUpperCase()));
        auction.setStartTime(LocalDateTime.parse(req.getStartTime()));
        auction.setEndTime(LocalDateTime.parse(req.getEndTime()));
        auction.setReservePriceBdt(req.getReservePriceBdt());
        auction = auctionRepository.save(auction);

        return getAuction(auction.getId());
    }

    public void deleteAuction(Long auctionId, Long vendorId) {
        Auction auction = auctionRepository.findById(auctionId)
            .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (!auction.getVendor().getId().equals(vendorId)) {
            throw new IllegalArgumentException("You do not own this auction");
        }
        auction.setStatus(AuctionStatus.CLOSED);
        auctionRepository.save(auction);
    }

    private AuctionSummaryResponse toSummary(Auction auction) {
        AuctionSummaryResponse res = new AuctionSummaryResponse();
        res.setId(auction.getId());
        if (auction.getVendor() != null) {
            res.setVendorId(auction.getVendor().getId());
            res.setVendorName(auction.getVendor().getDisplayName());
        }
        res.setTitle(auction.getTitle());
        res.setType(auction.getType().name());
        res.setStatus(auction.getStatus().name());
        res.setStartTime(auction.getStartTime());
        res.setEndTime(auction.getEndTime());
        res.setReservePriceBdt(auction.getReservePriceBdt());
        res.setCreatedAt(auction.getCreatedAt());
        return res;
    }

    private AuctionResponse toResponse(Auction auction) {
        AuctionResponse res = new AuctionResponse();
        res.setId(auction.getId());
        if (auction.getVendor() != null) {
            res.setVendorId(auction.getVendor().getId());
            res.setVendorName(auction.getVendor().getDisplayName());
        }
        res.setTitle(auction.getTitle());
        res.setType(auction.getType().name());
        res.setStatus(auction.getStatus().name());
        res.setStartTime(auction.getStartTime());
        res.setEndTime(auction.getEndTime());
        res.setReservePriceBdt(auction.getReservePriceBdt());
        res.setCreatedAt(auction.getCreatedAt());
        return res;
    }

    private AuctionLotResponse toLotResponse(AuctionLot lot) {
        AuctionLotResponse res = new AuctionLotResponse();
        res.setId(lot.getId());
        res.setAuctionId(lot.getAuction() != null ? lot.getAuction().getId() : null);
        res.setTitle(lot.getTitle());
        res.setDescription(lot.getDescription());
        res.setStartingPriceBdt(lot.getStartingPriceBdt());
        res.setCurrentBidBdt(lot.getCurrentBidBdt());
        res.setStatus(lot.getStatus().name());

        List<AuctionImage> images = auctionImageRepository.findByLot_Id(lot.getId());
        List<AuctionLotResponse.ImageItem> imageItems = new ArrayList<>();
        images.stream()
            .sorted(Comparator.comparing(AuctionImage::getId))
            .forEach(img -> imageItems.add(new AuctionLotResponse.ImageItem(img.getId(), img.getImageUrl())));
        res.setImages(imageItems);
        return res;
    }

    private BidResponse toBidResponse(Bid bid) {
        BidResponse res = new BidResponse();
        res.setId(bid.getId());
        res.setLotId(bid.getLot().getId());
        res.setBidderId(bid.getBidder().getId());
        res.setBidderName(bid.getBidder().getDisplayName());
        res.setAmountBdt(bid.getAmountBdt());
        Instant created = bid.getCreatedAt();
        res.setCreatedAt(created);
        return res;
    }
}
