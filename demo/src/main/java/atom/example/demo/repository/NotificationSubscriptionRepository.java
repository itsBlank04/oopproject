package atom.example.demo.repository;
import atom.example.demo.model.NotificationSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface NotificationSubscriptionRepository extends JpaRepository<NotificationSubscription, Long> {
    List<NotificationSubscription> findByUserId(Long userId);
}
