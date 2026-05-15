package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.UsedVideo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsedVideoRepository extends JpaRepository<UsedVideo, Long> {
    List<UsedVideo> findByListing_Id(Long listingId);
}
