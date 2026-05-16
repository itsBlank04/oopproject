package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.enums.OrderStatus;
import atomdrops.example.atomdrops.model.enums.UsedListingStatus;
import atomdrops.example.atomdrops.repository.OrderRepository;
import atomdrops.example.atomdrops.repository.ReviewRepository;
import atomdrops.example.atomdrops.repository.UsedListingRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BadgeService {

    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final UsedListingRepository usedListingRepository;
    private final UserRepository userRepository;

    public BadgeService(
            OrderRepository orderRepository,
            ReviewRepository reviewRepository,
            UsedListingRepository usedListingRepository,
            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
        this.usedListingRepository = usedListingRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getBadgesForUser(Long userId) {
        List<Map<String, Object>> badges = new ArrayList<>();
        long completedOrders = orderRepository.findAll().stream()
            .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
            .filter(o -> o.getItems().stream()
                .anyMatch(item -> item.getProduct().getVendor() != null
                    && item.getProduct().getVendor().getId().equals(userId)))
            .count();
        double avgRating = reviewRepository.findByReviewee_Id(userId).stream()
            .mapToInt(r -> r.getRating()).average().orElse(0);
        long listingsCount = usedListingRepository.findBySeller_Id(userId).stream()
            .filter(l -> l.getStatus() == UsedListingStatus.ACTIVE || l.getStatus() == UsedListingStatus.SOLD)
            .count();
        if (listingsCount >= 5 || avgRating >= 4.0) {
            badges.add(Map.of("name", "Verified Seller", "icon", "✓", "color", "blue"));
        }
        if (completedOrders >= 10 || listingsCount >= 20) {
            badges.add(Map.of("name", "Top Reseller", "icon", "★", "color", "amber"));
        }
        return badges;
    }
}
