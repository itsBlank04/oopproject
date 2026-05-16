package atomdrops.example.atomdrops.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "bidder_reputation")
public class BidderReputation {
    @Id
    @Column(name = "user_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "win_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal winRate = new BigDecimal("0.00");

    @Column(name = "total_bids", nullable = false)
    private Integer totalBids = 0;

    @Column(name = "total_wins", nullable = false)
    private Integer totalWins = 0;

    @Column(name = "payment_success_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal paymentSuccessRate = new BigDecimal("0.00");

    @Column(name = "cancellation_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal cancellationRate = new BigDecimal("0.00");

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public BidderReputation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public BigDecimal getWinRate() { return winRate; }
    public void setWinRate(BigDecimal winRate) { this.winRate = winRate; }
    public Integer getTotalBids() { return totalBids; }
    public void setTotalBids(Integer totalBids) { this.totalBids = totalBids; }
    public Integer getTotalWins() { return totalWins; }
    public void setTotalWins(Integer totalWins) { this.totalWins = totalWins; }
    public BigDecimal getPaymentSuccessRate() { return paymentSuccessRate; }
    public void setPaymentSuccessRate(BigDecimal paymentSuccessRate) { this.paymentSuccessRate = paymentSuccessRate; }
    public BigDecimal getCancellationRate() { return cancellationRate; }
    public void setCancellationRate(BigDecimal cancellationRate) { this.cancellationRate = cancellationRate; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
