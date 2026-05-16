package atomdrops.example.atomdrops.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import atomdrops.example.atomdrops.model.enums.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "used_listings")
public class UsedListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "condition_id")
    private ConditionLevel conditionLevel;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "price_bdt", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceBdt;

    @Enumerated(EnumType.STRING)
    @Column(name = "warranty_flag", nullable = false)
    private WarrantyFlag warrantyFlag = WarrantyFlag.NO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UsedListingStatus status = UsedListingStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public UsedListing() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getSeller() {
        return seller;
    }

    public void setSeller(User seller) {
        this.seller = seller;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public ConditionLevel getConditionLevel() {
        return conditionLevel;
    }

    public void setConditionLevel(ConditionLevel conditionLevel) {
        this.conditionLevel = conditionLevel;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPriceBdt() {
        return priceBdt;
    }

    public void setPriceBdt(BigDecimal priceBdt) {
        this.priceBdt = priceBdt;
    }

    public WarrantyFlag getWarrantyFlag() {
        return warrantyFlag;
    }

    public void setWarrantyFlag(WarrantyFlag warrantyFlag) {
        this.warrantyFlag = warrantyFlag;
    }

    public UsedListingStatus getStatus() {
        return status;
    }

    public void setStatus(UsedListingStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
