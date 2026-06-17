package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.FraudFlag;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FraudFlagRepository extends JpaRepository<FraudFlag, Long> {
    List<FraudFlag> findByUser_Id(Long userId);
}
