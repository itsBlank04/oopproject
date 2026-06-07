package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Auction;
import atom.example.demo.model.AuctionWinner;
import atom.example.demo.repository.AuctionRepository;
import atom.example.demo.repository.AuctionWinnerRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auction-winners")
public class AuctionWinnerController {

    private final AuctionWinnerRepository auctionWinnerRepository;
    private final AuctionRepository auctionRepository;

    public AuctionWinnerController(AuctionWinnerRepository auctionWinnerRepository,
                                   AuctionRepository auctionRepository) {
        this.auctionWinnerRepository = auctionWinnerRepository;
        this.auctionRepository = auctionRepository;
    }

    @GetMapping("/me")
    public List<AuctionWinner> myWins() {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return auctionWinnerRepository.findByWinnerId(userId);
    }

    @GetMapping("/lot/{lotId}")
    public AuctionWinner byLot(@PathVariable Long lotId) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Optional<AuctionWinner> winnerOpt = auctionWinnerRepository.findByLotId(lotId);
        if (winnerOpt.isEmpty()) throw new IllegalArgumentException("Winner not found");
        AuctionWinner winner = winnerOpt.get();
        Auction auction = winner.getLot().getAuction();
        boolean isVendor = auction != null && auction.getVendor() != null && auction.getVendor().getId().equals(userId);
        boolean isWinner = winner.getWinner() != null && winner.getWinner().getId().equals(userId);
        if (!isVendor && !isWinner) throw new IllegalArgumentException("Not allowed");
        return winner;
    }

    @GetMapping("/auction/{auctionId}")
    public List<AuctionWinner> byAuction(@PathVariable Long auctionId) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));
        if (auction.getVendor() == null || !auction.getVendor().getId().equals(userId))
            throw new IllegalArgumentException("Not your auction");
        return auction.getLots().stream()
                .map(lot -> auctionWinnerRepository.findByLotId(lot.getId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }
}
