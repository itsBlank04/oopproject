package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.FraudEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FraudEventRepository extends JpaRepository<FraudEvent, Long> {
    List<FraudEvent> findByUser_Id(Long userId);
}
