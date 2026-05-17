package atom.example.demo.repository;
import atom.example.demo.model.UsedListing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UsedListingRepository extends JpaRepository<UsedListing, Long> {
    List<UsedListing> findBySellerIdAndDeletedAtIsNull(Long sellerId);
    List<UsedListing> findByCategoryIdAndDeletedAtIsNull(Long categoryId);
    List<UsedListing> findByStatusAndDeletedAtIsNull(String status);
}
