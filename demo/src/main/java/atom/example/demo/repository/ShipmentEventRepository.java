package atom.example.demo.repository;
import atom.example.demo.model.ShipmentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ShipmentEventRepository extends JpaRepository<ShipmentEvent, Long> {
    List<ShipmentEvent> findByShipmentIdOrderByOccurredAtDesc(Long shipmentId);
}
