package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.AuctionImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionImageRepository extends JpaRepository<AuctionImage, Long> {
    List<AuctionImage> findByLot_Id(Long lotId);
}
