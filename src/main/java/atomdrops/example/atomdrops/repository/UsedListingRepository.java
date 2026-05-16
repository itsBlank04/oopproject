package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.UsedListing;
import atomdrops.example.atomdrops.model.enums.UsedListingStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsedListingRepository extends JpaRepository<UsedListing, Long> {
    List<UsedListing> findBySeller_Id(Long sellerId);
    List<UsedListing> findByCategory_Id(Long categoryId);
    List<UsedListing> findByStatus(UsedListingStatus status);
    List<UsedListing> findByCategory_IdAndStatus(Long categoryId, UsedListingStatus status);
    long countBySeller_IdAndStatus(Long sellerId, UsedListingStatus status);
}
