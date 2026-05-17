package atom.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "analytics_snapshots")
public class AnalyticsSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "snapshot_date", unique = true, nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "new_users_count", nullable = false)
    private int newUsersCount = 0;

    @Column(name = "active_users_count", nullable = false)
    private int activeUsersCount = 0;

    @Column(name = "new_orders_count", nullable = false)
    private int newOrdersCount = 0;

    @Column(name = "gross_revenue_bdt", nullable = false)
    private BigDecimal grossRevenueBdt = BigDecimal.ZERO;

    @Column(name = "platform_fees_bdt", nullable = false)
    private BigDecimal platformFeesBdt = BigDecimal.ZERO;

    @Column(name = "new_used_listings", nullable = false)
    private int newUsedListings = 0;

    @Column(name = "new_repair_requests", nullable = false)
    private int newRepairRequests = 0;

    @Column(name = "completed_repairs", nullable = false)
    private int completedRepairs = 0;

    @Column(name = "new_auctions_count", nullable = false)
    private int newAuctionsCount = 0;

    @Column(name = "auction_revenue_bdt", nullable = false)
    private BigDecimal auctionRevenueBdt = BigDecimal.ZERO;

    @Column(name = "fraud_flags_raised", nullable = false)
    private int fraudFlagsRaised = 0;

    @Column(name = "fraud_flags_resolved", nullable = false)
    private int fraudFlagsResolved = 0;

    @Column(name = "new_reports_count", nullable = false)
    private int newReportsCount = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getSnapshotDate() { return snapshotDate; }
    public void setSnapshotDate(LocalDate snapshotDate) { this.snapshotDate = snapshotDate; }
    public int getNewUsersCount() { return newUsersCount; }
    public void setNewUsersCount(int newUsersCount) { this.newUsersCount = newUsersCount; }
    public int getActiveUsersCount() { return activeUsersCount; }
    public void setActiveUsersCount(int activeUsersCount) { this.activeUsersCount = activeUsersCount; }
    public int getNewOrdersCount() { return newOrdersCount; }
    public void setNewOrdersCount(int newOrdersCount) { this.newOrdersCount = newOrdersCount; }
    public BigDecimal getGrossRevenueBdt() { return grossRevenueBdt; }
    public void setGrossRevenueBdt(BigDecimal grossRevenueBdt) { this.grossRevenueBdt = grossRevenueBdt; }
    public BigDecimal getPlatformFeesBdt() { return platformFeesBdt; }
    public void setPlatformFeesBdt(BigDecimal platformFeesBdt) { this.platformFeesBdt = platformFeesBdt; }
    public int getNewUsedListings() { return newUsedListings; }
    public void setNewUsedListings(int newUsedListings) { this.newUsedListings = newUsedListings; }
    public int getNewRepairRequests() { return newRepairRequests; }
    public void setNewRepairRequests(int newRepairRequests) { this.newRepairRequests = newRepairRequests; }
    public int getCompletedRepairs() { return completedRepairs; }
    public void setCompletedRepairs(int completedRepairs) { this.completedRepairs = completedRepairs; }
    public int getNewAuctionsCount() { return newAuctionsCount; }
    public void setNewAuctionsCount(int newAuctionsCount) { this.newAuctionsCount = newAuctionsCount; }
    public BigDecimal getAuctionRevenueBdt() { return auctionRevenueBdt; }
    public void setAuctionRevenueBdt(BigDecimal auctionRevenueBdt) { this.auctionRevenueBdt = auctionRevenueBdt; }
    public int getFraudFlagsRaised() { return fraudFlagsRaised; }
    public void setFraudFlagsRaised(int fraudFlagsRaised) { this.fraudFlagsRaised = fraudFlagsRaised; }
    public int getFraudFlagsResolved() { return fraudFlagsResolved; }
    public void setFraudFlagsResolved(int fraudFlagsResolved) { this.fraudFlagsResolved = fraudFlagsResolved; }
    public int getNewReportsCount() { return newReportsCount; }
    public void setNewReportsCount(int newReportsCount) { this.newReportsCount = newReportsCount; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
