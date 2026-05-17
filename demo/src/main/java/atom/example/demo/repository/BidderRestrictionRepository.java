package atom.example.demo.repository;
import atom.example.demo.model.BidderRestriction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface BidderRestrictionRepository extends JpaRepository<BidderRestriction, Long> {
    List<BidderRestriction> findByVendorId(Long vendorId);
    Optional<BidderRestriction> findByVendorIdAndBidderId(Long vendorId, Long bidderId);
    boolean existsByVendorIdAndBidderId(Long vendorId, Long bidderId);
}
