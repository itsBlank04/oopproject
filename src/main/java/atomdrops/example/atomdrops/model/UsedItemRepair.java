package atomdrops.example.atomdrops.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import atomdrops.example.atomdrops.model.enums.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "used_item_repairs")
public class UsedItemRepair {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private UsedListing listing;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String details;

    @Column(name = "repaired_at")
    private LocalDate repairedAt;

    public UsedItemRepair() {
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

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDate getRepairedAt() {
        return repairedAt;
    }

    public void setRepairedAt(LocalDate repairedAt) {
        this.repairedAt = repairedAt;
    }
}
