package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.TrustEvent;
import atomdrops.example.atomdrops.model.TrustScore;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.repository.TrustEventRepository;
import atomdrops.example.atomdrops.repository.TrustScoreRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TrustScoreService {

    private final TrustScoreRepository trustScoreRepository;
    private final TrustEventRepository trustEventRepository;
    private final UserRepository userRepository;

    public TrustScoreService(
            TrustScoreRepository trustScoreRepository,
            TrustEventRepository trustEventRepository,
            UserRepository userRepository) {
        this.trustScoreRepository = trustScoreRepository;
        this.trustEventRepository = trustEventRepository;
        this.userRepository = userRepository;
    }

    public TrustScore getOrCreate(Long userId) {
        return trustScoreRepository.findByUser_Id(userId)
            .orElseGet(() -> {
                User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
                TrustScore ts = new TrustScore();
                ts.setUser(user);
                ts.setScore(new BigDecimal("50.00"));
                return trustScoreRepository.save(ts);
            });
    }

    public TrustScore applyEvent(Long userId, String eventType, BigDecimal delta) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        TrustEvent event = new TrustEvent();
        event.setUser(user);
        event.setEventType(eventType);
        event.setDelta(delta);
        trustEventRepository.save(event);

        TrustScore ts = getOrCreate(userId);
        BigDecimal newScore = ts.getScore().add(delta);
        if (newScore.compareTo(BigDecimal.ZERO) < 0) newScore = BigDecimal.ZERO;
        if (newScore.compareTo(new BigDecimal("100.00")) > 0) newScore = new BigDecimal("100.00");
        ts.setScore(newScore);
        return trustScoreRepository.save(ts);
    }
}
