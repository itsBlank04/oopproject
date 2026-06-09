package atom.example.demo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "vendor_subscription_plans")
public class VendorSubscriptionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "max_shops", nullable = false)
    private Integer maxShops;

    @Column(name = "price_monthly_bdt", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceMonthlyBdt;

    @Column(name = "price_yearly_bdt", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceYearlyBdt;

    @Column(name = "discount_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String features;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
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

    public VendorSubscriptionPlan() {}

    public VendorSubscriptionPlan(String name, String displayName, Integer maxShops, BigDecimal priceMonthlyBdt, BigDecimal priceYearlyBdt, BigDecimal discountPercent, String features) {
        this.name = name;
        this.displayName = displayName;
        this.maxShops = maxShops;
        this.priceMonthlyBdt = priceMonthlyBdt;
        this.priceYearlyBdt = priceYearlyBdt;
        this.discountPercent = discountPercent;
        this.features = features;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public Integer getMaxShops() { return maxShops; }
    public void setMaxShops(Integer maxShops) { this.maxShops = maxShops; }
    public BigDecimal getPriceMonthlyBdt() { return priceMonthlyBdt; }
    public void setPriceMonthlyBdt(BigDecimal priceMonthlyBdt) { this.priceMonthlyBdt = priceMonthlyBdt; }
    public BigDecimal getPriceYearlyBdt() { return priceYearlyBdt; }
    public void setPriceYearlyBdt(BigDecimal priceYearlyBdt) { this.priceYearlyBdt = priceYearlyBdt; }
    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }
    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
