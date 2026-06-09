package atom.example.demo.scheduler;

import atom.example.demo.model.Notification;
import atom.example.demo.model.Shop;
import atom.example.demo.model.VendorSubscription;
import atom.example.demo.repository.NotificationRepository;
import atom.example.demo.repository.ShopRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorSubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class SubscriptionScheduler {

    private final VendorSubscriptionRepository vendorSubscriptionRepository;
    private final ShopRepository shopRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public SubscriptionScheduler(VendorSubscriptionRepository vendorSubscriptionRepository,
                                  ShopRepository shopRepository,
                                  NotificationRepository notificationRepository,
                                  UserRepository userRepository) {
        this.vendorSubscriptionRepository = vendorSubscriptionRepository;
        this.shopRepository = shopRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void processExpiredSubscriptions() {
        Instant now = Instant.now();

        // 1. ACTIVE → GRACE_PERIOD when expiresAt has passed
        List<VendorSubscription> expiredActive = vendorSubscriptionRepository
            .findByStatusAndExpiresAtBefore("ACTIVE", now);
        for (VendorSubscription sub : expiredActive) {
            sub.setStatus("GRACE_PERIOD");
            sub.setGracePeriodEnds(now.plus(7, ChronoUnit.DAYS));
            vendorSubscriptionRepository.save(sub);

            sendNotification(sub.getVendor().getId(), "SUBSCRIPTION_EXPIRED",
                "Subscription Expired",
                "Your " + sub.getPlan().getDisplayName() + " plan has expired. " +
                "You have a 7-day grace period to renew before your shops are paused.");
        }

        // 2. GRACE_PERIOD → EXPIRED when gracePeriodEnds has passed
        List<VendorSubscription> expiredGrace = vendorSubscriptionRepository
            .findByStatusAndGracePeriodEndsBefore("GRACE_PERIOD", now);
        for (VendorSubscription sub : expiredGrace) {
            sub.setStatus("EXPIRED");
            vendorSubscriptionRepository.save(sub);

            // Pause all non-archived shops
            List<Shop> shops = shopRepository.findByVendorId(sub.getVendor().getId());
            for (Shop shop : shops) {
                if ("ACTIVE".equals(shop.getStatus())) {
                    shop.setStatus("PAUSED");
                    shopRepository.save(shop);
                }
            }

            sendNotification(sub.getVendor().getId(), "SUBSCRIPTION_TERMINATED",
                "Subscription Terminated",
                "Your grace period has ended and your subscription has expired. " +
                "Your shops have been paused. Renew your plan to reactivate them.");
        }
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void sendExpiryWarnings() {
        Instant now = Instant.now();

        List<VendorSubscription> activeSubs = vendorSubscriptionRepository
            .findByExpiresAtBetween(now, now.plus(1, ChronoUnit.DAYS));
        for (VendorSubscription sub : activeSubs) {
            sendNotification(sub.getVendor().getId(), "SUBSCRIPTION_EXPIRING_SOON",
                "Subscription Expires Tomorrow",
                "Your " + sub.getPlan().getDisplayName() + " plan expires tomorrow. " +
                "Renew now to avoid interruption.");
        }

        List<VendorSubscription> threeDaySubs = vendorSubscriptionRepository
            .findByExpiresAtBetween(now.plus(1, ChronoUnit.DAYS), now.plus(3, ChronoUnit.DAYS));
        for (VendorSubscription sub : threeDaySubs) {
            sendNotification(sub.getVendor().getId(), "SUBSCRIPTION_EXPIRING",
                "Subscription Expires in 3 Days",
                "Your " + sub.getPlan().getDisplayName() + " plan expires in 3 days. " +
                "Renew to keep your shops active.");
        }

        List<VendorSubscription> sevenDaySubs = vendorSubscriptionRepository
            .findByExpiresAtBetween(now.plus(3, ChronoUnit.DAYS), now.plus(7, ChronoUnit.DAYS));
        for (VendorSubscription sub : sevenDaySubs) {
            sendNotification(sub.getVendor().getId(), "SUBSCRIPTION_EXPIRING",
                "Subscription Expires in 7 Days",
                "Your " + sub.getPlan().getDisplayName() + " plan expires in 7 days. " +
                "Renew to avoid entering the grace period.");
        }
    }

    private void sendNotification(Long userId, String type, String title, String body) {
        Notification n = new Notification();
        n.setUser(userRepository.getReferenceById(userId));
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setEntityType("SUBSCRIPTION");
        notificationRepository.save(n);
    }
}
