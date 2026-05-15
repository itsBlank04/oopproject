package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Watchlist;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    List<Watchlist> findByUser_Id(Long userId);
    Optional<Watchlist> findByUser_IdAndLot_Id(Long userId, Long lotId);
}
