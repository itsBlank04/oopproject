package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.AuctionApproval;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionApprovalRepository extends JpaRepository<AuctionApproval, Long> {
    Optional<AuctionApproval> findByAuction_Id(Long auctionId);
}
