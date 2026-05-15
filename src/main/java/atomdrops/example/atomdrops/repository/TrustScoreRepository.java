package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.TrustScore;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrustScoreRepository extends JpaRepository<TrustScore, Long> {
    Optional<TrustScore> findByUser_Id(Long userId);
}
