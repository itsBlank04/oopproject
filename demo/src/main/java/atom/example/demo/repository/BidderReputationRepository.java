package atom.example.demo.repository;
import atom.example.demo.model.BidderReputation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface BidderReputationRepository extends JpaRepository<BidderReputation, Long> {
    Optional<BidderReputation> findByUserId(Long userId);
}
