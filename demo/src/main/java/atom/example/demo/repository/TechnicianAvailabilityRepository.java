package atom.example.demo.repository;
import atom.example.demo.model.TechnicianAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TechnicianAvailabilityRepository extends JpaRepository<TechnicianAvailability, Long> {
    List<TechnicianAvailability> findByTechnicianId(Long technicianId);
}
