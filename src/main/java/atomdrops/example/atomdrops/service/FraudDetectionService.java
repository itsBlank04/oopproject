package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Bid;
import atomdrops.example.atomdrops.model.FraudEvent;
import atomdrops.example.atomdrops.model.FraudFlag;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.enums.FraudFlagStatus;
import atomdrops.example.atomdrops.repository.BidRepository;
import atomdrops.example.atomdrops.repository.FraudEventRepository;
import atomdrops.example.atomdrops.repository.FraudFlagRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FraudDetectionService {

    private final FraudFlagRepository fraudFlagRepository;
    private final FraudEventRepository fraudEventRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;

    public FraudDetectionService(
            FraudFlagRepository fraudFlagRepository,
            FraudEventRepository fraudEventRepository,
            UserRepository userRepository,
            BidRepository bidRepository) {
        this.fraudFlagRepository = fraudFlagRepository;
        this.fraudEventRepository = fraudEventRepository;
        this.userRepository = userRepository;
        this.bidRepository = bidRepository;
    }

    public FraudFlag flagUser(Long userId, String reason) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        FraudFlag flag = new FraudFlag();
        flag.setUser(user);
        flag.setReason(reason);
        flag.setStatus(FraudFlagStatus.OPEN);
        fraudEventRepository.save(createEvent(userId, reason));
        return fraudFlagRepository.save(flag);
    }

    public List<FraudFlag> getOpenFlags() {
        return fraudFlagRepository.findByStatus(FraudFlagStatus.OPEN);
    }

    public void resolveFlag(Long flagId) {
        FraudFlag flag = fraudFlagRepository.findById(flagId).orElseThrow(() -> new IllegalArgumentException("Fraud flag not found: " + flagId));
        flag.setStatus(FraudFlagStatus.RESOLVED);
        fraudFlagRepository.save(flag);
    }

    public void autoDetectAndFlag(Long userId) {
        List<FraudEvent> events = fraudEventRepository.findByUser_Id(userId);
        if (events.size() >= 3) {
            boolean alreadyFlagged = fraudFlagRepository.findByUser_Id(userId).stream()
                .anyMatch(f -> f.getStatus() == FraudFlagStatus.OPEN);
            if (!alreadyFlagged) {
                flagUser(userId, "Auto-detected: Multiple suspicious events (" + events.size() + ")");
            }
        }
        List<Bid> bids = bidRepository.findByBidder_Id(userId);
        if (bids.size() > 20) {
            long recentBids = bids.stream().filter(b -> b.getCreatedAt() != null
                && b.getCreatedAt().isAfter(java.time.Instant.now().minus(java.time.Duration.ofHours(1)))).count();
            if (recentBids > 10) {
                boolean alreadyFlagged = fraudFlagRepository.findByUser_Id(userId).stream()
                    .anyMatch(f -> f.getStatus() == FraudFlagStatus.OPEN);
                if (!alreadyFlagged) {
                    flagUser(userId, "Auto-detected: Suspicious bidding activity (" + recentBids + " bids in last hour)");
                }
            }
        }
    }

    private FraudEvent createEvent(Long userId, String reason) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        FraudEvent event = new FraudEvent();
        event.setUser(user);
        event.setEventType("MANUAL_FLAG");
        event.setDetails(reason);
        return event;
    }
}
