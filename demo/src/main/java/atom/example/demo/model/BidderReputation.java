package atom.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bidder_reputation")
public class BidderReputation {

    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "auctions_won", nullable = false)
    private int auctionsWon = 0;

    @Column(name = "auctions_entered", nullable = false)
    private int auctionsEntered = 0;

    @Column(name = "win_rate", nullable = false)
    private BigDecimal winRate = BigDecimal.ZERO;

    @Column(name = "payment_success_rate", nullable = false)
    private BigDecimal paymentSuccessRate = BigDecimal.ZERO;

    @Column(name = "cancellation_rate", nullable = false)
    private BigDecimal cancellationRate = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public int getAuctionsWon() { return auctionsWon; }
    public void setAuctionsWon(int auctionsWon) { this.auctionsWon = auctionsWon; }
    public int getAuctionsEntered() { return auctionsEntered; }
    public void setAuctionsEntered(int auctionsEntered) { this.auctionsEntered = auctionsEntered; }
    public BigDecimal getWinRate() { return winRate; }
    public void setWinRate(BigDecimal winRate) { this.winRate = winRate; }
    public BigDecimal getPaymentSuccessRate() { return paymentSuccessRate; }
    public void setPaymentSuccessRate(BigDecimal paymentSuccessRate) { this.paymentSuccessRate = paymentSuccessRate; }
    public BigDecimal getCancellationRate() { return cancellationRate; }
    public void setCancellationRate(BigDecimal cancellationRate) { this.cancellationRate = cancellationRate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
