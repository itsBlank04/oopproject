package atom.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "used_item_history")
public class UsedItemHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "listing_id")
    private UsedListing listing;

    @Column(name = "owner_count", nullable = false)
    private int ownerCount = 1;

    @Column(name = "usage_duration_months")
    private Integer usageDurationMonths;

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
    public UsedListing getListing() { return listing; }
    public void setListing(UsedListing listing) { this.listing = listing; }
    public int getOwnerCount() { return ownerCount; }
    public void setOwnerCount(int ownerCount) { this.ownerCount = ownerCount; }
    public Integer getUsageDurationMonths() { return usageDurationMonths; }
    public void setUsageDurationMonths(Integer usageDurationMonths) { this.usageDurationMonths = usageDurationMonths; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
