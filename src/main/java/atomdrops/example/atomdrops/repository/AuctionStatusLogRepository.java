package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.AuctionStatusLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionStatusLogRepository extends JpaRepository<AuctionStatusLog, Long> {
    List<AuctionStatusLog> findByAuction_IdOrderByChangedAtAsc(Long auctionId);
}
