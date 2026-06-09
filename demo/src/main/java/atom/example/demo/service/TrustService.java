package atom.example.demo.service;

import atom.example.demo.model.*;
import atom.example.demo.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class TrustService {

    private final TrustScoreRepository trustScoreRepository;
    private final TrustEventRepository trustEventRepository;
    private final UserRepository userRepository;
    private final ShopRepository shopRepository;
    private final NotificationRepository notificationRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final BanHistoryRepository banHistoryRepository;

    public TrustService(TrustScoreRepository trustScoreRepository,
                        TrustEventRepository trustEventRepository,
                        UserRepository userRepository,
                        ShopRepository shopRepository,
                        NotificationRepository notificationRepository,
                        PlatformSettingRepository platformSettingRepository,
                        BanHistoryRepository banHistoryRepository) {
        this.trustScoreRepository = trustScoreRepository;
        this.trustEventRepository = trustEventRepository;
        this.userRepository = userRepository;
        this.shopRepository = shopRepository;
        this.notificationRepository = notificationRepository;
        this.platformSettingRepository = platformSettingRepository;
        this.banHistoryRepository = banHistoryRepository;
    }

    @Transactional
    public TrustScore adjustScore(Long userId, BigDecimal delta, String eventType, String note) {
        TrustScore ts = trustScoreRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
            TrustScore newTs = new TrustScore();
            newTs.setUser(user);
            newTs.setScore(new BigDecimal("50"));
            return trustScoreRepository.save(newTs);
        });

        BigDecimal newScore = ts.getScore().add(delta).max(BigDecimal.ZERO).min(new BigDecimal("100"));
        ts.setScore(newScore);
        trustScoreRepository.save(ts);

        TrustEvent event = new TrustEvent();
        event.setUser(ts.getUser());
        event.setEventType(eventType);
        event.setDelta(delta);
        event.setNote(note);
        trustEventRepository.save(event);

        checkAndAutoPause(userId, ts);
        return ts;
    }

    public TrustScore getScore(Long userId) {
        return trustScoreRepository.findByUserId(userId).orElse(null);
    }

    public List<TrustEvent> getEvents(Long userId) {
        return trustEventRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    private void checkAndAutoPause(Long userId, TrustScore ts) {
        String thresholdStr = platformSettingRepository.findById("trust.suspension_threshold")
            .map(s -> s.getValue()).orElse("20");
        BigDecimal threshold = new BigDecimal(thresholdStr);

        if (ts.getScore().compareTo(threshold) <= 0) {
            // Pause all shops
            List<Shop> shops = shopRepository.findByVendorId(userId);
            for (Shop shop : shops) {
                if ("ACTIVE".equals(shop.getStatus())) {
                    shop.setStatus("PAUSED");
                    shopRepository.save(shop);
                }
            }

            // Create auto-suspension record
            BanHistory ban = new BanHistory();
            ban.setUser(userRepository.findById(userId).orElse(null));
            ban.setAction("SUSPENDED");
            ban.setReason("Trust score dropped to " + ts.getScore() + " — shops auto-paused");
            ban.setExpiresAt(Instant.now().plus(7, ChronoUnit.DAYS));
            banHistoryRepository.save(ban);

            // Notify vendor
            Notification n = new Notification();
            n.setUser(ban.getUser());
            n.setType("TRUST_SUSPENSION");
            n.setTitle("Trust Score Warning — Shops Paused");
            n.setBody("Your trust score has dropped to " + ts.getScore() + ". " +
                "Your shops have been paused. Improve your score by completing orders successfully.");
            n.setEntityType("TRUST");
            notificationRepository.save(n);
        }
    }
}
