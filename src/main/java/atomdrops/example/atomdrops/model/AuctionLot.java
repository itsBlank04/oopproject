package atomdrops.example.atomdrops.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import atomdrops.example.atomdrops.model.enums.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "auction_lots")
public class AuctionLot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id")
    private Auction auction;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "starting_price_bdt", nullable = false, precision = 12, scale = 2)
    private BigDecimal startingPriceBdt;

    @Column(name = "current_bid_bdt", nullable = false, precision = 12, scale = 2)
    private BigDecimal currentBidBdt = new BigDecimal("0.00");

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LotStatus status = LotStatus.PREPARING;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public AuctionLot() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Auction getAuction() { return auction; }
    public void setAuction(Auction auction) { this.auction = auction; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getStartingPriceBdt() { return startingPriceBdt; }
    public void setStartingPriceBdt(BigDecimal startingPriceBdt) { this.startingPriceBdt = startingPriceBdt; }
    public BigDecimal getCurrentBidBdt() { return currentBidBdt; }
    public void setCurrentBidBdt(BigDecimal currentBidBdt) { this.currentBidBdt = currentBidBdt; }
    public LotStatus getStatus() { return status; }
    public void setStatus(LotStatus status) { this.status = status; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
