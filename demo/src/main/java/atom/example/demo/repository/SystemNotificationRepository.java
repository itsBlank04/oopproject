package atom.example.demo.repository;
import atom.example.demo.model.SystemNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SystemNotificationRepository extends JpaRepository<SystemNotification, Long> {
    List<SystemNotification> findByIsActiveTrueAndStartsAtBeforeOrderByStartsAtDesc(java.time.Instant now);
}
