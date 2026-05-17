package atom.example.demo.repository;
import atom.example.demo.model.TechnicianSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TechnicianSkillRepository extends JpaRepository<TechnicianSkill, Long> {
    List<TechnicianSkill> findByTechnicianId(Long technicianId);
}
