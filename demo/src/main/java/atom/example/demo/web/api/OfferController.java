package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.UsedListing;
import atom.example.demo.model.UsedListingOffer;
import atom.example.demo.model.UsedListingOfferMessage;
import atom.example.demo.model.User;
import atom.example.demo.repository.UsedListingOfferMessageRepository;
import atom.example.demo.repository.UsedListingOfferRepository;
import atom.example.demo.repository.UsedListingRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class OfferController {

    private final UsedListingRepository usedListingRepository;
    private final UsedListingOfferRepository usedListingOfferRepository;
    private final UsedListingOfferMessageRepository usedListingOfferMessageRepository;
    private final UserRepository userRepository;

    public OfferController(UsedListingRepository usedListingRepository,
            UsedListingOfferRepository usedListingOfferRepository,
            UsedListingOfferMessageRepository usedListingOfferMessageRepository,
            UserRepository userRepository) {
        this.usedListingRepository = usedListingRepository;
        this.usedListingOfferRepository = usedListingOfferRepository;
        this.usedListingOfferMessageRepository = usedListingOfferMessageRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/used-listings/{id}/offers")
    public UsedListingOffer createOffer(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User buyer = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        UsedListing listing = usedListingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Listing not found"));
        UsedListingOffer offer = new UsedListingOffer();
        offer.setListing(listing);
        offer.setBuyer(buyer);
        offer.setOfferBdt(new BigDecimal(body.get("offerBdt").toString()));
        offer.setExpiresAt(Instant.parse(body.get("expiresAt").toString()));
        return usedListingOfferRepository.save(offer);
    }

    @GetMapping("/used-listings/{id}/offers")
    public List<UsedListingOffer> getOffersForListing(@PathVariable Long id, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        UsedListing listing = usedListingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Listing not found"));
        if (!listing.getSeller().getId().equals(userId)) throw new IllegalArgumentException("Not your listing");
        return usedListingOfferRepository.findByListingId(id);
    }

    @PutMapping("/offers/{id}/accept")
    public UsedListingOffer acceptOffer(@PathVariable Long id, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        UsedListingOffer offer = usedListingOfferRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        if (!offer.getListing().getSeller().getId().equals(userId)) throw new IllegalArgumentException("Not your listing");
        offer.setStatus("ACCEPTED");
        return usedListingOfferRepository.save(offer);
    }

    @PutMapping("/offers/{id}/reject")
    public UsedListingOffer rejectOffer(@PathVariable Long id, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        UsedListingOffer offer = usedListingOfferRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        if (!offer.getListing().getSeller().getId().equals(userId)) throw new IllegalArgumentException("Not your listing");
        offer.setStatus("REJECTED");
        return usedListingOfferRepository.save(offer);
    }

    @PutMapping("/offers/{id}/withdraw")
    public UsedListingOffer withdrawOffer(@PathVariable Long id, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        UsedListingOffer offer = usedListingOfferRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        if (!offer.getBuyer().getId().equals(userId)) throw new IllegalArgumentException("Not your offer");
        offer.setStatus("WITHDRAWN");
        return usedListingOfferRepository.save(offer);
    }

    @GetMapping("/offers/sent")
    public List<UsedListingOffer> getSentOffers(HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return usedListingOfferRepository.findByBuyerId(userId);
    }

    @PostMapping("/offers/{id}/messages")
    public UsedListingOfferMessage sendMessage(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User sender = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        UsedListingOffer offer = usedListingOfferRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Offer not found"));
        UsedListingOfferMessage msg = new UsedListingOfferMessage();
        msg.setOffer(offer);
        msg.setSender(sender);
        msg.setMessage((String) body.get("message"));
        if (body.containsKey("counterOfferBdt")) msg.setCounterOfferBdt(new BigDecimal(body.get("counterOfferBdt").toString()));
        return usedListingOfferMessageRepository.save(msg);
    }

    @GetMapping("/offers/{id}/messages")
    public List<UsedListingOfferMessage> getMessages(@PathVariable Long id) {
        return usedListingOfferMessageRepository.findByOfferIdOrderByCreatedAtAsc(id);
    }
}
