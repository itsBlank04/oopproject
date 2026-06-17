package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.TechnicianSkill;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TechnicianSkillRepository extends JpaRepository<TechnicianSkill, Long> {
    List<TechnicianSkill> findByTechnician_Id(Long technicianId);
}
