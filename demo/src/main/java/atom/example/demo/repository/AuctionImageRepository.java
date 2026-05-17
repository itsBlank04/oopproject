package atom.example.demo.repository;
import atom.example.demo.model.AuctionImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AuctionImageRepository extends JpaRepository<AuctionImage, Long> {
    List<AuctionImage> findByLotIdOrderBySortOrderAsc(Long lotId);
}
