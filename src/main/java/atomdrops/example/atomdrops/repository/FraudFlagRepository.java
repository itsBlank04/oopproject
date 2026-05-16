package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.FraudFlag;
import atomdrops.example.atomdrops.model.enums.FraudFlagStatus;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FraudFlagRepository extends JpaRepository<FraudFlag, Long> {
    List<FraudFlag> findByUser_Id(Long userId);
    @EntityGraph(attributePaths = {"user"})
    List<FraudFlag> findByStatus(FraudFlagStatus status);
}
