package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.BidderRestriction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BidderRestrictionRepository extends JpaRepository<BidderRestriction, Long> {
    List<BidderRestriction> findByVendor_Id(Long vendorId);
    Optional<BidderRestriction> findByVendor_IdAndBidder_Id(Long vendorId, Long bidderId);
}
