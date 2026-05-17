package atom.example.demo.repository;
import atom.example.demo.model.AuctionLot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AuctionLotRepository extends JpaRepository<AuctionLot, Long> {
    List<AuctionLot> findByAuctionId(Long auctionId);
    List<AuctionLot> findByStatus(String status);
    List<AuctionLot> findByCategoryId(Long categoryId);
}
