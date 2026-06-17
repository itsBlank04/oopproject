package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.NotificationSubscription;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationSubscriptionRepository extends JpaRepository<NotificationSubscription, Long> {
    List<NotificationSubscription> findByUser_Id(Long userId);
}
