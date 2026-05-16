package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.BidderReputation;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.repository.BidderReputationRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BidderReputationService {

    private final BidderReputationRepository bidderReputationRepository;
    private final UserRepository userRepository;

    public BidderReputationService(
            BidderReputationRepository bidderReputationRepository,
            UserRepository userRepository) {
        this.bidderReputationRepository = bidderReputationRepository;
        this.userRepository = userRepository;
    }

    public BidderReputation getOrCreate(Long userId) {
        return bidderReputationRepository.findByUser_Id(userId)
            .orElseGet(() -> {
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
                BidderReputation br = new BidderReputation();
                br.setUser(user);
                return bidderReputationRepository.save(br);
            });
    }

    public BidderReputation recordWin(Long userId) {
        BidderReputation br = getOrCreate(userId);
        br.setTotalBids(br.getTotalBids() + 1);
        br.setTotalWins(br.getTotalWins() + 1);
        if (br.getTotalBids() > 0) {
            BigDecimal rate = BigDecimal.valueOf(br.getTotalWins())
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(br.getTotalBids()), 2, RoundingMode.HALF_UP);
            br.setWinRate(rate);
        }
        return bidderReputationRepository.save(br);
    }

    public BidderReputation recordPaymentSuccess(Long userId) {
        BidderReputation br = getOrCreate(userId);
        br.setPaymentSuccessRate(br.getPaymentSuccessRate().add(new BigDecimal("1.00")));
        return bidderReputationRepository.save(br);
    }

    public BidderReputation recordCancellation(Long userId) {
        BidderReputation br = getOrCreate(userId);
        br.setCancellationRate(br.getCancellationRate().add(new BigDecimal("1.00")));
        return bidderReputationRepository.save(br);
    }
}
