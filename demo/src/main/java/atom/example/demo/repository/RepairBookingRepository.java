package atom.example.demo.repository;
import atom.example.demo.model.RepairBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface RepairBookingRepository extends JpaRepository<RepairBooking, Long> {
    Optional<RepairBooking> findByRequestId(Long requestId);
    List<RepairBooking> findByTechnicianId(Long technicianId);
    List<RepairBooking> findByTechnicianIdAndStatus(Long technicianId, String status);
}
