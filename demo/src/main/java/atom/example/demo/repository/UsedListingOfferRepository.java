package atom.example.demo.repository;
import atom.example.demo.model.UsedListingOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface UsedListingOfferRepository extends JpaRepository<UsedListingOffer, Long> {
    List<UsedListingOffer> findByListingId(Long listingId);
    List<UsedListingOffer> findByBuyerId(Long buyerId);
    Optional<UsedListingOffer> findByListingIdAndBuyerId(Long listingId, Long buyerId);
}
