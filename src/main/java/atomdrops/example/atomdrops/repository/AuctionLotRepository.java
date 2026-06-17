package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.AuctionLot;
import atomdrops.example.atomdrops.model.enums.LotStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionLotRepository extends JpaRepository<AuctionLot, Long> {
    List<AuctionLot> findByAuction_Id(Long auctionId);
    List<AuctionLot> findByStatus(LotStatus status);
}
