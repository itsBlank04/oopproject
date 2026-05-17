package atom.example.demo.repository;
import atom.example.demo.model.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByOrderId(Long orderId);
}
