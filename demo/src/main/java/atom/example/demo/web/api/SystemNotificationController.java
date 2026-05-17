package atom.example.demo.web.api;

import atom.example.demo.model.SystemNotification;
import atom.example.demo.repository.SystemNotificationRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system-notifications")
public class SystemNotificationController {

    private final SystemNotificationRepository systemNotificationRepository;

    public SystemNotificationController(SystemNotificationRepository systemNotificationRepository) {
        this.systemNotificationRepository = systemNotificationRepository;
    }

    @GetMapping
    public List<SystemNotification> listActive() {
        return systemNotificationRepository.findByIsActiveTrueAndStartsAtBeforeOrderByStartsAtDesc(Instant.now());
    }
}
