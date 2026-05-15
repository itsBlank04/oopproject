package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.UsedItemRepair;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsedItemRepairRepository extends JpaRepository<UsedItemRepair, Long> {
    List<UsedItemRepair> findByListing_Id(Long listingId);
}
