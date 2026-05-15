package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.UsedImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsedImageRepository extends JpaRepository<UsedImage, Long> {
    List<UsedImage> findByListing_IdOrderBySortOrder(Long listingId);
}
