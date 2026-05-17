package atom.example.demo.repository;
import atom.example.demo.model.OrderStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface OrderStatusLogRepository extends JpaRepository<OrderStatusLog, Long> {
    List<OrderStatusLog> findByOrderIdOrderByChangedAtDesc(Long orderId);
}
