package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.RepairMedia;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairMediaRepository extends JpaRepository<RepairMedia, Long> {
    List<RepairMedia> findByRequest_Id(Long requestId);
}
