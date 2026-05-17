package atom.example.demo.repository;
import atom.example.demo.model.UsedImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UsedImageRepository extends JpaRepository<UsedImage, Long> {
    List<UsedImage> findByListingIdOrderBySortOrderAsc(Long listingId);
}
