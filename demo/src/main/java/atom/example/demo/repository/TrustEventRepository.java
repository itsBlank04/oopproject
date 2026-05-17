package atom.example.demo.repository;
import atom.example.demo.model.TrustEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TrustEventRepository extends JpaRepository<TrustEvent, Long> {
    List<TrustEvent> findByUserIdOrderByCreatedAtDesc(Long userId);
}
