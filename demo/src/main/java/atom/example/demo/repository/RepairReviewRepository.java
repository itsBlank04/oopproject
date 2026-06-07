package atom.example.demo.repository;
import atom.example.demo.model.RepairReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface RepairReviewRepository extends JpaRepository<RepairReview, Long> {
    Optional<RepairReview> findByBookingId(Long bookingId);
    List<RepairReview> findByTechnicianId(Long technicianId);
    List<RepairReview> findByCustomerId(Long customerId);
}
