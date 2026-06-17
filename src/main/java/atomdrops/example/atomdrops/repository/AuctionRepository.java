package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Auction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuctionRepository extends JpaRepository<Auction, Long> {
    List<Auction> findByVendor_Id(Long vendorId);
}
