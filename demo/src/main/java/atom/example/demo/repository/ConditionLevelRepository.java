package atom.example.demo.repository;
import atom.example.demo.model.ConditionLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ConditionLevelRepository extends JpaRepository<ConditionLevel, Long> {
    List<ConditionLevel> findAllByOrderBySortOrderAsc();
}
