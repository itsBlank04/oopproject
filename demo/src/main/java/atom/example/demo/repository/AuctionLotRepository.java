package atom.example.demo.repository;
import atom.example.demo.model.AuctionLot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
public interface AuctionLotRepository extends JpaRepository<AuctionLot, Long> {
    List<AuctionLot> findByAuctionId(Long auctionId);
    List<AuctionLot> findByStatus(String status);
    List<AuctionLot> findByCategoryId(Long categoryId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT l FROM AuctionLot l JOIN FETCH l.auction a LEFT JOIN FETCH a.vendor WHERE l.id = :id")
    Optional<AuctionLot> findByIdForUpdate(@Param("id") Long id);
}
