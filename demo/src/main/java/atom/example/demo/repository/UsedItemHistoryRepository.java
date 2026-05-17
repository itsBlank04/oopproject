package atom.example.demo.repository;
import atom.example.demo.model.UsedItemHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UsedItemHistoryRepository extends JpaRepository<UsedItemHistory, Long> {
    Optional<UsedItemHistory> findByListingId(Long listingId);
}
