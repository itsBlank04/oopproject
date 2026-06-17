package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.RepairQuote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairQuoteRepository extends JpaRepository<RepairQuote, Long> {
    List<RepairQuote> findByRequest_Id(Long requestId);
    List<RepairQuote> findByTechnician_Id(Long technicianId);
}
