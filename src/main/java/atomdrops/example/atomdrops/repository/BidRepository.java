package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Bid;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByLot_IdOrderByAmountBdtDesc(Long lotId);
    List<Bid> findByBidder_Id(Long bidderId);
    Optional<Bid> findTopByLot_IdOrderByAmountBdtDesc(Long lotId);
}
