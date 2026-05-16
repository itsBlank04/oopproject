package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.BidderReputation;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BidderReputationRepository extends JpaRepository<BidderReputation, Long> {
    @EntityGraph(attributePaths = {"user"})
    Optional<BidderReputation> findByUser_Id(Long userId);
}
