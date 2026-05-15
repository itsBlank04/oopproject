package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Technician;
import atomdrops.example.atomdrops.model.enums.TechnicianSpecialization;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TechnicianRepository extends JpaRepository<Technician, Long> {
    Optional<Technician> findByUser_Id(Long userId);
    List<Technician> findBySpecialization(TechnicianSpecialization specialization);
}
