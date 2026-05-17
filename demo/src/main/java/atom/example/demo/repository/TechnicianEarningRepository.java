package atom.example.demo.repository;
import atom.example.demo.model.TechnicianEarning;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TechnicianEarningRepository extends JpaRepository<TechnicianEarning, Long> {
    List<TechnicianEarning> findByTechnicianId(Long technicianId);
    List<TechnicianEarning> findByStatus(String status);
}
