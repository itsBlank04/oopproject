package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.AuctionPayment;
import atom.example.demo.model.AuctionWinner;
import atom.example.demo.repository.AuctionPaymentRepository;
import atom.example.demo.repository.AuctionWinnerRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auction-payments")
public class AuctionPaymentController {

    private final AuctionPaymentRepository auctionPaymentRepository;
    private final AuctionWinnerRepository auctionWinnerRepository;

    public AuctionPaymentController(AuctionPaymentRepository auctionPaymentRepository,
                                    AuctionWinnerRepository auctionWinnerRepository) {
        this.auctionPaymentRepository = auctionPaymentRepository;
        this.auctionWinnerRepository = auctionWinnerRepository;
    }

    @PostMapping("/{winnerId}")
    public AuctionPayment pay(@PathVariable Long winnerId, @RequestBody Map<String, Object> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        AuctionWinner winner = auctionWinnerRepository.findById(winnerId)
                .orElseThrow(() -> new IllegalArgumentException("Auction winner not found"));
        if (!winner.getWinner().getId().equals(userId))
            throw new IllegalArgumentException("Not your auction win");

        String method = (String) body.getOrDefault("method", "DUMMY");
        String gatewayName = (String) body.get("gatewayName");
        String transactionRef = (String) body.get("transactionRef");

        AuctionPayment payment = new AuctionPayment();
        payment.setAuctionWinner(winner);
        payment.setAmountBdt(winner.getFinalPriceBdt());
        payment.setStatus("PAID");
        payment.setMethod(method);
        payment.setGatewayName(gatewayName);
        payment.setTransactionRef(transactionRef);
        payment.setPaidAt(Instant.now());
        payment = auctionPaymentRepository.save(payment);

        winner.setPaymentStatus("PAID");
        winner.setPaidAt(Instant.now());
        auctionWinnerRepository.save(winner);

        return payment;
    }

    @GetMapping("/{winnerId}")
    public List<AuctionPayment> getPayment(@PathVariable Long winnerId) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        AuctionWinner winner = auctionWinnerRepository.findById(winnerId)
                .orElseThrow(() -> new IllegalArgumentException("Auction winner not found"));
        if (!winner.getWinner().getId().equals(userId))
            throw new IllegalArgumentException("Not your auction win");
        return auctionPaymentRepository.findByAuctionWinnerId(winnerId)
                .map(List::of).orElse(List.of());
    }
}
