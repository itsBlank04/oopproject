package atom.example.demo.repository;
import atom.example.demo.model.AnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshot, Long> {
    List<AnalyticsSnapshot> findAllByOrderBySnapshotDateDesc();
}
