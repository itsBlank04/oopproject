package atom.example.demo.repository;
import atom.example.demo.model.AuctionStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AuctionStatusLogRepository extends JpaRepository<AuctionStatusLog, Long> {
    List<AuctionStatusLog> findByAuctionIdOrderByChangedAtDesc(Long auctionId);
}
