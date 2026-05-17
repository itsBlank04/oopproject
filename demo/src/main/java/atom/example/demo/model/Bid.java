package atom.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bids")
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id")
    private AuctionLot lot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bidder_id")
    private User bidder;

    @Column(name = "amount_bdt", nullable = false)
    private BigDecimal amountBdt;

    @Column(name = "is_winning", nullable = false)
    private boolean isWinning = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AuctionLot getLot() { return lot; }
    public void setLot(AuctionLot lot) { this.lot = lot; }
    public User getBidder() { return bidder; }
    public void setBidder(User bidder) { this.bidder = bidder; }
    public BigDecimal getAmountBdt() { return amountBdt; }
    public void setAmountBdt(BigDecimal amountBdt) { this.amountBdt = amountBdt; }
    public boolean isWinning() { return isWinning; }
    public void setWinning(boolean winning) { isWinning = winning; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
