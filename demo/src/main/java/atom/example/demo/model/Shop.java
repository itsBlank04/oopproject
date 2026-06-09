package atom.example.demo.model;

import atom.example.demo.category.Category;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "shops")
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "vendor_id", nullable = false)
    @JsonIgnoreProperties({"passwordHash", "roles", "deletedAt", "createdAt", "updatedAt", "phone", "avatarUrl", "status", "hibernateLazyInitializer", "handler"})
    private User vendor;

    @Column(nullable = false, unique = true, length = 180)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    @Column(name = "banner_url", columnDefinition = "TEXT")
    private String bannerUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "primary_category_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Category primaryCategory;

    @Column(length = 180)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String policies;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE"; // ACTIVE, PAUSED, ARCHIVED

    @Column(name = "verification_level", nullable = false, length = 20)
    private String verificationLevel = "STANDARD"; // STANDARD, VERIFIED, PREMIUM, TRUSTED

    @Column(name = "response_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal responseRate = BigDecimal.ZERO;

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
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Category getPrimaryCategory() { return primaryCategory; }
    public void setPrimaryCategory(Category primaryCategory) { this.primaryCategory = primaryCategory; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getPolicies() { return policies; }
    public void setPolicies(String policies) { this.policies = policies; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getVerificationLevel() { return verificationLevel; }
    public void setVerificationLevel(String verificationLevel) { this.verificationLevel = verificationLevel; }
    public BigDecimal getResponseRate() { return responseRate; }
    public void setResponseRate(BigDecimal responseRate) { this.responseRate = responseRate; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
