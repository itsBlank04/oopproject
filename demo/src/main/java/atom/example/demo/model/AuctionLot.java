package atom.example.demo.model;

import atom.example.demo.category.Category;
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
import jakarta.persistence.OneToMany;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "auction_lots")
public class AuctionLot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_id")
    @JsonIgnoreProperties({"lots", "hibernateLazyInitializer", "handler"})
    private Auction auction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "condition_note")
    private String conditionNote;

    @Column(name = "starting_price_bdt", nullable = false)
    private BigDecimal startingPriceBdt;

    @Column(name = "reserve_price_bdt")
    private BigDecimal reservePriceBdt;

    @Column(name = "current_bid_bdt", nullable = false)
    private BigDecimal currentBidBdt = BigDecimal.ZERO;

    @Column(name = "min_bid_increment_bdt", nullable = false)
    private BigDecimal minBidIncrementBdt = new BigDecimal("10");

    @Column(name = "extension_duration_minutes", nullable = false)
    private int extensionDurationMinutes = 5;

    @Column(name = "extensions_count", nullable = false)
    private int extensionsCount = 0;

    @Column(name = "max_extensions", nullable = false)
    private int maxExtensions = 3;

    @Column(nullable = false)
    private String status = "PREPARING";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "lot", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"lot", "hibernateLazyInitializer", "handler"})
    private List<AuctionImage> images = new ArrayList<>();

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
    public Auction getAuction() { return auction; }
    public void setAuction(Auction auction) { this.auction = auction; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getConditionNote() { return conditionNote; }
    public void setConditionNote(String conditionNote) { this.conditionNote = conditionNote; }
    public BigDecimal getStartingPriceBdt() { return startingPriceBdt; }
    public void setStartingPriceBdt(BigDecimal startingPriceBdt) { this.startingPriceBdt = startingPriceBdt; }
    public BigDecimal getReservePriceBdt() { return reservePriceBdt; }
    public void setReservePriceBdt(BigDecimal reservePriceBdt) { this.reservePriceBdt = reservePriceBdt; }
    public BigDecimal getCurrentBidBdt() { return currentBidBdt; }
    public void setCurrentBidBdt(BigDecimal currentBidBdt) { this.currentBidBdt = currentBidBdt; }
    public BigDecimal getMinBidIncrementBdt() { return minBidIncrementBdt; }
    public void setMinBidIncrementBdt(BigDecimal minBidIncrementBdt) { this.minBidIncrementBdt = minBidIncrementBdt; }
    public int getExtensionDurationMinutes() { return extensionDurationMinutes; }
    public void setExtensionDurationMinutes(int extensionDurationMinutes) { this.extensionDurationMinutes = extensionDurationMinutes; }
    public int getExtensionsCount() { return extensionsCount; }
    public void setExtensionsCount(int extensionsCount) { this.extensionsCount = extensionsCount; }
    public int getMaxExtensions() { return maxExtensions; }
    public void setMaxExtensions(int maxExtensions) { this.maxExtensions = maxExtensions; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<AuctionImage> getImages() { return images; }
    public void setImages(List<AuctionImage> images) { this.images = images; }
}
