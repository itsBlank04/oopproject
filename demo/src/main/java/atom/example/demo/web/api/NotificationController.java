package atom.example.demo.web.api;

import atom.example.demo.model.Notification;
import atom.example.demo.repository.NotificationRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public List<Notification> list(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @PutMapping("/{id}/read")
    public Notification markRead(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Notification notification = notificationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) throw new IllegalArgumentException("Not your notification");
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @PutMapping("/read-all")
    public Map<String, String> markAllRead(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        for (Notification n : unread) {
            n.setRead(true);
            notificationRepository.save(n);
        }
        return Map.of("message", "All marked as read");
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Notification notification = notificationRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getUser().getId().equals(userId)) throw new IllegalArgumentException("Not your notification");
        notificationRepository.delete(notification);
        return Map.of("message", "Deleted");
    }
}
