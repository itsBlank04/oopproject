package atom.example.demo.repository;
import atom.example.demo.model.AuctionWatchlist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface AuctionWatchlistRepository extends JpaRepository<AuctionWatchlist, Long> {
    List<AuctionWatchlist> findByUserId(Long userId);
    Optional<AuctionWatchlist> findByUserIdAndLotId(Long userId, Long lotId);
    boolean existsByUserIdAndLotId(Long userId, Long lotId);
    void deleteByUserIdAndLotId(Long userId, Long lotId);
}
