package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.RepairRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairRequestRepository extends JpaRepository<RepairRequest, Long> {
    List<RepairRequest> findByCustomer_Id(Long customerId);
}
