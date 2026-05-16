package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Notification;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.repository.NotificationRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public Notification create(Long userId, String title, String body) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setBody(body);
        n.setIsRead(false);
        return notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public List<Notification> getNotifications(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
    }

    public void markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!n.getUser().getId().equals(userId)) throw new IllegalArgumentException("Unauthorized");
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    public void markAllRead(Long userId) {
        List<Notification> notifications = notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        for (Notification n : notifications) {
            n.setIsRead(true);
        }
        notificationRepository.saveAll(notifications);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId)
            .stream().filter(n -> !Boolean.TRUE.equals(n.getIsRead())).count();
    }
}
