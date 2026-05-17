package atom.example.demo.repository;
import atom.example.demo.model.AuctionWinner;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface AuctionWinnerRepository extends JpaRepository<AuctionWinner, Long> {
    Optional<AuctionWinner> findByLotId(Long lotId);
    List<AuctionWinner> findByWinnerId(Long winnerId);
    List<AuctionWinner> findByPaymentStatus(String paymentStatus);
}
