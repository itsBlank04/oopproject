package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.AuctionImage;
import atom.example.demo.model.AuctionLot;
import atom.example.demo.model.Auction;
import atom.example.demo.model.Bid;
import atom.example.demo.repository.AuctionImageRepository;
import atom.example.demo.repository.AuctionLotRepository;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.category.CategoryRepository;
import atom.example.demo.category.Category;
import atom.example.demo.service.BidService;
import java.time.Instant;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuctionLotController {

    private final AuctionLotRepository auctionLotRepository;
    private final AuctionImageRepository auctionImageRepository;
    private final AuctionRepository auctionRepository;
    private final CategoryRepository categoryRepository;
    private final BidService bidService;

    public AuctionLotController(AuctionLotRepository auctionLotRepository,
            AuctionImageRepository auctionImageRepository,
            AuctionRepository auctionRepository,
            CategoryRepository categoryRepository,
            BidService bidService) {
        this.auctionLotRepository = auctionLotRepository;
        this.auctionImageRepository = auctionImageRepository;
        this.auctionRepository = auctionRepository;
        this.categoryRepository = categoryRepository;
        this.bidService = bidService;
    }

    @GetMapping("/auction-lots/{id}")
    public AuctionLot getLot(@PathVariable Long id) {
        return auctionLotRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Lot not found"));
    }

    @GetMapping("/auction-lots/{id}/bids")
    public List<Bid> getBids(@PathVariable Long id) {
        return bidService.getLotBids(id);
    }

    @PostMapping("/auctions/{auctionId}/lots")
    public AuctionLot createLot(@PathVariable Long auctionId, @RequestBody Map<String, Object> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (!auction.getVendor().getId().equals(userId))
            throw new IllegalArgumentException("Not your auction");
        if (!"CREATED".equals(auction.getStatus()))
            throw new IllegalArgumentException("Can only add lots to draft auctions");

        AuctionLot lot = new AuctionLot();
        lot.setAuction(auction);
        lot.setTitle((String) body.get("title"));
        lot.setDescription((String) body.getOrDefault("description", ""));
        lot.setConditionNote((String) body.getOrDefault("conditionNote", ""));
        if (lot.getTitle() == null || lot.getTitle().isBlank())
            throw new IllegalArgumentException("Lot title is required");
        if (!body.containsKey("startingPriceBdt") || body.get("startingPriceBdt") == null)
            throw new IllegalArgumentException("Starting price is required");
        if (body.containsKey("categoryId")) {
            Long categoryId = Long.valueOf(body.get("categoryId").toString());
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            lot.setCategory(category);
        }

        BigDecimal starting = new BigDecimal(body.get("startingPriceBdt").toString());
        lot.setStartingPriceBdt(starting);
        lot.setCurrentBidBdt(starting);

        if (body.containsKey("reservePriceBdt") && body.get("reservePriceBdt") != null) {
            lot.setReservePriceBdt(new BigDecimal(body.get("reservePriceBdt").toString()));
        }
        if (body.containsKey("minBidIncrementBdt") && body.get("minBidIncrementBdt") != null) {
            lot.setMinBidIncrementBdt(new BigDecimal(body.get("minBidIncrementBdt").toString()));
        }
        if (body.containsKey("extensionDurationMinutes")) {
            lot.setExtensionDurationMinutes(Integer.parseInt(body.get("extensionDurationMinutes").toString()));
        }
        if (body.containsKey("maxExtensions")) {
            lot.setMaxExtensions(Integer.parseInt(body.get("maxExtensions").toString()));
        }
        lot.setStatus("PREPARING");
        return auctionLotRepository.save(lot);
    }

    @PutMapping("/auction-lots/{id}")
    public AuctionLot updateLot(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        AuctionLot lot = auctionLotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found"));
        Auction auction = lot.getAuction();
        if (auction == null || auction.getVendor() == null || !auction.getVendor().getId().equals(userId))
            throw new IllegalArgumentException("Not your auction");
        if (!"CREATED".equals(auction.getStatus()))
            throw new IllegalArgumentException("Can only edit lots on draft auctions");

        if (body.containsKey("title")) lot.setTitle((String) body.get("title"));
        if (body.containsKey("description")) lot.setDescription((String) body.get("description"));
        if (body.containsKey("conditionNote")) lot.setConditionNote((String) body.get("conditionNote"));
        if (body.containsKey("categoryId")) {
            Long categoryId = Long.valueOf(body.get("categoryId").toString());
            Category category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            lot.setCategory(category);
        }
        if (body.containsKey("startingPriceBdt")) {
            BigDecimal starting = new BigDecimal(body.get("startingPriceBdt").toString());
            lot.setStartingPriceBdt(starting);
            if (lot.getCurrentBidBdt() == null || lot.getCurrentBidBdt().compareTo(BigDecimal.ZERO) <= 0) {
                lot.setCurrentBidBdt(starting);
            }
        }
        if (body.containsKey("reservePriceBdt")) {
            Object reserve = body.get("reservePriceBdt");
            lot.setReservePriceBdt(reserve == null ? null : new BigDecimal(reserve.toString()));
        }
        if (body.containsKey("minBidIncrementBdt")) {
            lot.setMinBidIncrementBdt(new BigDecimal(body.get("minBidIncrementBdt").toString()));
        }
        if (body.containsKey("extensionDurationMinutes")) {
            lot.setExtensionDurationMinutes(Integer.parseInt(body.get("extensionDurationMinutes").toString()));
        }
        if (body.containsKey("maxExtensions")) {
            lot.setMaxExtensions(Integer.parseInt(body.get("maxExtensions").toString()));
        }
        return auctionLotRepository.save(lot);
    }

    @DeleteMapping("/auction-lots/{id}")
    public Map<String, String> deleteLot(@PathVariable Long id) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        AuctionLot lot = auctionLotRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found"));
        Auction auction = lot.getAuction();
        if (auction == null || auction.getVendor() == null || !auction.getVendor().getId().equals(userId))
            throw new IllegalArgumentException("Not your auction");
        if (!"CREATED".equals(auction.getStatus()))
            throw new IllegalArgumentException("Can only delete lots on draft auctions");
        auctionLotRepository.delete(lot);
        return Map.of("message", "Deleted");
    }

    @PostMapping("/auction-lots/{id}/images")
    public AuctionImage addImage(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        AuctionLot lot = auctionLotRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Lot not found"));
        Auction auction = lot.getAuction();
        if (auction == null || auction.getVendor() == null || !auction.getVendor().getId().equals(userId))
            throw new IllegalArgumentException("Not your auction");
        AuctionImage image = new AuctionImage();
        image.setLot(lot);
        image.setImageUrl((String) body.get("imageUrl"));
        if (body.containsKey("sortOrder")) image.setSortOrder(Integer.parseInt(body.get("sortOrder").toString()));
        image.setCreatedAt(Instant.now());
        return auctionImageRepository.save(image);
    }

    @PostMapping("/auction-lots/{id}/bids")
    public Bid placeBid(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        BigDecimal amountBdt = new BigDecimal(body.get("amountBdt").toString());
        return bidService.placeBid(id, userId, amountBdt);
    }
}
