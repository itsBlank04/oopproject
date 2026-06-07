package atom.example.demo.repository;
import atom.example.demo.model.RepairProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RepairProgressRepository extends JpaRepository<RepairProgress, Long> {
    List<RepairProgress> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
    List<RepairProgress> findByBookingIdOrderByCreatedAtAsc(Long bookingId);
}
