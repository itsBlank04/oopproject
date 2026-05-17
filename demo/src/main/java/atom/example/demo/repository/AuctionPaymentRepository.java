package atom.example.demo.repository;
import atom.example.demo.model.AuctionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AuctionPaymentRepository extends JpaRepository<AuctionPayment, Long> {
    Optional<AuctionPayment> findByAuctionWinnerId(Long auctionWinnerId);
}
