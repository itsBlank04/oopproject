package atom.example.demo.repository;
import atom.example.demo.model.Technician;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface TechnicianRepository extends JpaRepository<Technician, Long> {
    Optional<Technician> findByUserId(Long userId);
    List<Technician> findBySpecialization(String specialization);
    List<Technician> findByLevel(String level);
    List<Technician> findByStatus(String status);
}
