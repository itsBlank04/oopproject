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
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "used_item_repairs")
public class UsedItemRepair {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private UsedListing listing;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String details;

    @Column(name = "repaired_at")
    private LocalDate repairedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UsedListing getListing() { return listing; }
    public void setListing(UsedListing listing) { this.listing = listing; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public LocalDate getRepairedAt() { return repairedAt; }
    public void setRepairedAt(LocalDate repairedAt) { this.repairedAt = repairedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
