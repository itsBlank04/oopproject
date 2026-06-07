package atom.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnTransformer;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "technicians")
public class Technician {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false)
    private String specialization;

    @Column(name = "pickup_available", nullable = false)
    private boolean pickupAvailable = false;

    @Column(name = "service_area")
    private String serviceArea;

    @Column(name = "website_url")
    private String websiteUrl;

    @Column(name = "social_links", columnDefinition = "JSONB")
    @ColumnTransformer(write = "?::jsonb")
    private String socialLinks;

    @Column(nullable = false)
    private String level = "Beginner";

    @Column(name = "rating_avg", nullable = false)
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "completion_rate", nullable = false)
    private BigDecimal completionRate = BigDecimal.ZERO;

    @Column(nullable = false)
    private String status = "active";

    // ─── New fields from master prompt ───
    @Column(name = "completed_jobs", nullable = false)
    private int completedJobs = 0;

    @Column(columnDefinition = "TEXT")
    private String certifications;

    @Column(name = "experience_years", nullable = false)
    private int experienceYears = 0;

    @Column(name = "response_time", length = 100)
    private String responseTime; // "Usually replies in 30 min"

    @Column(name = "success_rate")
    private BigDecimal successRate;

    @Column(name = "photo_url")
    private String photoUrl;

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
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public boolean isPickupAvailable() { return pickupAvailable; }
    public void setPickupAvailable(boolean pickupAvailable) { this.pickupAvailable = pickupAvailable; }
    public String getServiceArea() { return serviceArea; }
    public void setServiceArea(String serviceArea) { this.serviceArea = serviceArea; }
    public String getWebsiteUrl() { return websiteUrl; }
    public void setWebsiteUrl(String websiteUrl) { this.websiteUrl = websiteUrl; }
    public String getSocialLinks() { return socialLinks; }
    public void setSocialLinks(String socialLinks) { this.socialLinks = socialLinks; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public BigDecimal getRatingAvg() { return ratingAvg; }
    public void setRatingAvg(BigDecimal ratingAvg) { this.ratingAvg = ratingAvg; }
    public BigDecimal getCompletionRate() { return completionRate; }
    public void setCompletionRate(BigDecimal completionRate) { this.completionRate = completionRate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getCompletedJobs() { return completedJobs; }
    public void setCompletedJobs(int completedJobs) { this.completedJobs = completedJobs; }
    public String getCertifications() { return certifications; }
    public void setCertifications(String certifications) { this.certifications = certifications; }
    public int getExperienceYears() { return experienceYears; }
    public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }
    public String getResponseTime() { return responseTime; }
    public void setResponseTime(String responseTime) { this.responseTime = responseTime; }
    public BigDecimal getSuccessRate() { return successRate; }
    public void setSuccessRate(BigDecimal successRate) { this.successRate = successRate; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
