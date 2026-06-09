package atom.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import org.hibernate.annotations.NotFound;
import org.hibernate.annotations.NotFoundAction;
import java.util.ArrayList;
import java.util.List;
import java.time.Instant;

@Entity
@Table(name = "auctions")
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    @NotFound(action = NotFoundAction.IGNORE)
    private User vendor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shop_id")
    @JsonIgnoreProperties({"vendor", "hibernateLazyInitializer", "handler"})
    private Shop shop;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String status = "CREATED";

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "end_time")
    private Instant endTime;

    @Column(name = "preparation_duration_minutes")
    private Integer preparationDurationMinutes = 10;

    @Column(name = "active_duration_minutes")
    private Integer activeDurationMinutes = 60;

    @Column(name = "terms_accepted", nullable = false)
    private boolean termsAccepted = false;

    @OneToMany(mappedBy = "auction", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"auction", "hibernateLazyInitializer", "handler"})
    private List<AuctionLot> lots = new ArrayList<>();

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
    public User getVendor() { return vendor; }
    public void setVendor(User vendor) { this.vendor = vendor; }
    public Shop getShop() { return shop; }
    public void setShop(Shop shop) { this.shop = shop; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public Integer getPreparationDurationMinutes() { return preparationDurationMinutes; }
    public void setPreparationDurationMinutes(Integer preparationDurationMinutes) { this.preparationDurationMinutes = preparationDurationMinutes; }
    public Integer getActiveDurationMinutes() { return activeDurationMinutes; }
    public void setActiveDurationMinutes(Integer activeDurationMinutes) { this.activeDurationMinutes = activeDurationMinutes; }
    public boolean isTermsAccepted() { return termsAccepted; }
    public void setTermsAccepted(boolean termsAccepted) { this.termsAccepted = termsAccepted; }
    public List<AuctionLot> getLots() { return lots; }
    public void setLots(List<AuctionLot> lots) { this.lots = lots; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}


