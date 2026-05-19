package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.AuctionImage;
import atom.example.demo.model.AuctionLot;
import atom.example.demo.model.Bid;
import atom.example.demo.model.User;
import atom.example.demo.repository.AuctionImageRepository;
import atom.example.demo.repository.AuctionLotRepository;
import atom.example.demo.repository.BidRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuctionLotController {

    private final AuctionLotRepository auctionLotRepository;
    private final AuctionImageRepository auctionImageRepository;
    private final BidRepository bidRepository;
    private final UserRepository userRepository;

    public AuctionLotController(AuctionLotRepository auctionLotRepository,
            AuctionImageRepository auctionImageRepository, BidRepository bidRepository,
            UserRepository userRepository) {
        this.auctionLotRepository = auctionLotRepository;
        this.auctionImageRepository = auctionImageRepository;
        this.bidRepository = bidRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/auction-lots/{id}")
    public AuctionLot getLot(@PathVariable Long id) {
        return auctionLotRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Lot not found"));
    }

    @GetMapping("/auction-lots/{id}/bids")
    public List<Bid> getBids(@PathVariable Long id) {
        return bidRepository.findByLotIdOrderByAmountBdtDesc(id);
    }

    @PostMapping("/auction-lots/{id}/images")
    public AuctionImage addImage(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        AuctionLot lot = auctionLotRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Lot not found"));
        AuctionImage image = new AuctionImage();
        image.setLot(lot);
        image.setImageUrl((String) body.get("imageUrl"));
        if (body.containsKey("sortOrder")) image.setSortOrder(Integer.parseInt(body.get("sortOrder").toString()));
        return auctionImageRepository.save(image);
    }

    @PostMapping("/auction-lots/{id}/bids")
    public Bid placeBid(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        User bidder = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        AuctionLot lot = auctionLotRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Lot not found"));
        Bid bid = new Bid();
        bid.setLot(lot);
        bid.setBidder(bidder);
        bid.setAmountBdt(new BigDecimal(body.get("amountBdt").toString()));
        Bid top = bidRepository.findTopByLotIdOrderByAmountBdtDesc(id).orElse(null);
        if (top == null || bid.getAmountBdt().compareTo(top.getAmountBdt()) > 0) {
            bid.setWinning(true);
            if (top != null) {
                top.setWinning(false);
                bidRepository.save(top);
            }
        }
        return bidRepository.save(bid);
    }
}
