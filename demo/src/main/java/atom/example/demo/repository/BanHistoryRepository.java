package atom.example.demo.repository;
import atom.example.demo.model.BanHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BanHistoryRepository extends JpaRepository<BanHistory, Long> {
    List<BanHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
