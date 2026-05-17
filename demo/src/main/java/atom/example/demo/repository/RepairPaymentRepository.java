package atom.example.demo.repository;
import atom.example.demo.model.RepairPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface RepairPaymentRepository extends JpaRepository<RepairPayment, Long> {
    Optional<RepairPayment> findByBookingId(Long bookingId);
}
