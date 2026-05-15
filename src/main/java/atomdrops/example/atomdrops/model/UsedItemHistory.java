package atomdrops.example.atomdrops.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import atomdrops.example.atomdrops.model.enums.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "used_item_history")
public class UsedItemHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private UsedListing listing;

    @Column(name = "owner_count")
    private int ownerCount = 1;

    @Column(name = "usage_duration_months")
    private Integer usageDurationMonths;

    public UsedItemHistory() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UsedListing getListing() {
        return listing;
    }

    public void setListing(UsedListing listing) {
        this.listing = listing;
    }

    public int getOwnerCount() {
        return ownerCount;
    }

    public void setOwnerCount(int ownerCount) {
        this.ownerCount = ownerCount;
    }

    public Integer getUsageDurationMonths() {
        return usageDurationMonths;
    }

    public void setUsageDurationMonths(Integer usageDurationMonths) {
        this.usageDurationMonths = usageDurationMonths;
    }
}
