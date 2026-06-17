package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.TrustEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrustEventRepository extends JpaRepository<TrustEvent, Long> {
    List<TrustEvent> findByUser_Id(Long userId);
}
