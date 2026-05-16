package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Auction;
import atomdrops.example.atomdrops.model.enums.AuctionStatus;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    List<Auction> findByVendor_Id(Long vendorId);
    @EntityGraph(attributePaths = {"vendor"})
    List<Auction> findByStatus(AuctionStatus status);
}
