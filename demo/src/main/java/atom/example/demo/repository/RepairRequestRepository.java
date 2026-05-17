package atom.example.demo.repository;
import atom.example.demo.model.RepairRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RepairRequestRepository extends JpaRepository<RepairRequest, Long> {
    List<RepairRequest> findByCustomerId(Long customerId);
    List<RepairRequest> findByStatus(String status);
}
