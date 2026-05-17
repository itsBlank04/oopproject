package atom.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "auction_winners")
public class AuctionWinner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id")
    private AuctionLot lot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private User winner;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winning_bid_id")
    private Bid winningBid;

    @Column(name = "final_price_bdt")
    private BigDecimal finalPriceBdt;

    @Column(name = "reserve_met", nullable = false)
    private boolean reserveMet = true;

    @Column(name = "payment_status", nullable = false)
    private String paymentStatus = "PENDING";

    @Column(name = "payment_deadline")
    private Instant paymentDeadline;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "non_payment_count", nullable = false)
    private int nonPaymentCount = 0;

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
    public AuctionLot getLot() { return lot; }
    public void setLot(AuctionLot lot) { this.lot = lot; }
    public User getWinner() { return winner; }
    public void setWinner(User winner) { this.winner = winner; }
    public Bid getWinningBid() { return winningBid; }
    public void setWinningBid(Bid winningBid) { this.winningBid = winningBid; }
    public BigDecimal getFinalPriceBdt() { return finalPriceBdt; }
    public void setFinalPriceBdt(BigDecimal finalPriceBdt) { this.finalPriceBdt = finalPriceBdt; }
    public boolean isReserveMet() { return reserveMet; }
    public void setReserveMet(boolean reserveMet) { this.reserveMet = reserveMet; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public Instant getPaymentDeadline() { return paymentDeadline; }
    public void setPaymentDeadline(Instant paymentDeadline) { this.paymentDeadline = paymentDeadline; }
    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
    public int getNonPaymentCount() { return nonPaymentCount; }
    public void setNonPaymentCount(int nonPaymentCount) { this.nonPaymentCount = nonPaymentCount; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
