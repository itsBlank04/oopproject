package atom.example.demo.repository;
import atom.example.demo.model.UsedVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UsedVideoRepository extends JpaRepository<UsedVideo, Long> {
    List<UsedVideo> findByListingId(Long listingId);
}
