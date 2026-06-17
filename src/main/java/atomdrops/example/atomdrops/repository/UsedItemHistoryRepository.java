package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.UsedItemHistory;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsedItemHistoryRepository extends JpaRepository<UsedItemHistory, Long> {
    Optional<UsedItemHistory> findByListing_Id(Long listingId);
}
