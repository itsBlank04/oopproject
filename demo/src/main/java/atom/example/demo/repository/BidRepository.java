package atom.example.demo.repository;
import atom.example.demo.model.Bid;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByLotIdOrderByAmountBdtDesc(Long lotId);
    List<Bid> findByLotIdOrderByCreatedAtDesc(Long lotId);
    Optional<Bid> findTopByLotIdOrderByAmountBdtDesc(Long lotId);
    List<Bid> findByBidderId(Long bidderId);
    boolean existsByLotIdAndBidderId(Long lotId, Long bidderId);
    long countByLotIdAndCreatedAtAfter(Long lotId, Instant createdAt);
}
