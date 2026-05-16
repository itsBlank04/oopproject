package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.BidderRestriction;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.repository.BidderRestrictionRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BidderRestrictionService {

    private final BidderRestrictionRepository bidderRestrictionRepository;
    private final UserRepository userRepository;

    public BidderRestrictionService(BidderRestrictionRepository bidderRestrictionRepository, UserRepository userRepository) {
        this.bidderRestrictionRepository = bidderRestrictionRepository;
        this.userRepository = userRepository;
    }

    public BidderRestriction restrictBidder(Long vendorId, Long bidderId, String reason) {
        if (vendorId.equals(bidderId)) throw new IllegalArgumentException("Cannot restrict yourself");
        User vendor = userRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));
        User bidder = userRepository.findById(bidderId)
            .orElseThrow(() -> new IllegalArgumentException("Bidder not found"));
        if (bidderRestrictionRepository.findByVendor_IdAndBidder_Id(vendorId, bidderId).isPresent()) {
            throw new IllegalArgumentException("Bidder already restricted");
        }
        BidderRestriction br = new BidderRestriction();
        br.setVendor(vendor);
        br.setBidder(bidder);
        br.setReason(reason);
        return bidderRestrictionRepository.save(br);
    }

    public void unrestrictBidder(Long vendorId, Long bidderId) {
        BidderRestriction br = bidderRestrictionRepository
            .findByVendor_IdAndBidder_Id(vendorId, bidderId)
            .orElseThrow(() -> new IllegalArgumentException("Restriction not found"));
        bidderRestrictionRepository.delete(br);
    }

    @Transactional(readOnly = true)
    public List<BidderRestriction> getRestrictions(Long vendorId) {
        return bidderRestrictionRepository.findByVendor_Id(vendorId);
    }

    @Transactional(readOnly = true)
    public boolean isRestricted(Long vendorId, Long bidderId) {
        return bidderRestrictionRepository.findByVendor_IdAndBidder_Id(vendorId, bidderId).isPresent();
    }
}
