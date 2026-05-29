package atom.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "upgrade_payments")
public class UpgradePayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "upgrade_id", nullable = false)
    private RoleUpgrade upgrade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "amount_bdt", nullable = false)
    private BigDecimal amountBdt;

    @Column(nullable = false, length = 10)
    private String currency = "BDT";

    @Column(nullable = false, length = 20)
    private String method;

    @Column(nullable = false, length = 20)
    private String status = "INITIATED";

    @Column(name = "provider_ref", length = 100)
    private String providerRef;

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
    public RoleUpgrade getUpgrade() { return upgrade; }
    public void setUpgrade(RoleUpgrade upgrade) { this.upgrade = upgrade; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public BigDecimal getAmountBdt() { return amountBdt; }
    public void setAmountBdt(BigDecimal amountBdt) { this.amountBdt = amountBdt; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getProviderRef() { return providerRef; }
    public void setProviderRef(String providerRef) { this.providerRef = providerRef; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
