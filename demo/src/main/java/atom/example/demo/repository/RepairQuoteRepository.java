package atom.example.demo.repository;
import atom.example.demo.model.RepairQuote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RepairQuoteRepository extends JpaRepository<RepairQuote, Long> {
    List<RepairQuote> findByRequestId(Long requestId);
    List<RepairQuote> findByTechnicianId(Long technicianId);
}
