package atom.example.demo.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "vendor_subscriptions")
public class VendorSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, unique = true)
    private User vendor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private VendorSubscriptionPlan plan;

    @Column(name = "billing_cycle", nullable = false, length = 10)
    private String billingCycle = "FREE"; // FREE, MONTHLY, YEARLY

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, PAUSED, GRACE_PERIOD, EXPIRED

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "grace_period_ends")
    private Instant gracePeriodEnds;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (startsAt == null) {
            startsAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getVendor() { return vendor; }
    public void setVendor(User vendor) { this.vendor = vendor; }
    public VendorSubscriptionPlan getPlan() { return plan; }
    public void setPlan(VendorSubscriptionPlan plan) { this.plan = plan; }
    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getStartsAt() { return startsAt; }
    public void setStartsAt(Instant startsAt) { this.startsAt = startsAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getGracePeriodEnds() { return gracePeriodEnds; }
    public void setGracePeriodEnds(Instant gracePeriodEnds) { this.gracePeriodEnds = gracePeriodEnds; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
