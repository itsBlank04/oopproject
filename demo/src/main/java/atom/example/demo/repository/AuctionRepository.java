package atom.example.demo.repository;
import atom.example.demo.model.Auction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AuctionRepository extends JpaRepository<Auction, Long> {
    List<Auction> findByVendorId(Long vendorId);
    List<Auction> findByStatus(String status);
    List<Auction> findByStatusAndType(String status, String type);
}
