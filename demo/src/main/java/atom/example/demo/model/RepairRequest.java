package atom.example.demo.model;

import atom.example.demo.category.Category;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.CascadeType;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "repair_requests")
public class RepairRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "address_id")
    private Address address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    // ─── Problem information ───
    @Column(length = 255)
    private String title;

    @Column(name = "device_type", length = 120)
    private String deviceType;

    @Column(length = 120)
    private String brand;

    @Column(name = "device_model", length = 120)
    private String deviceModel;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    // ─── Service location ───
    @Column(name = "service_location", length = 30)
    private String serviceLocation = "HOME_VISIT"; // HOME_VISIT, WORKSHOP, PICKUP

    @Column(name = "contact_number", length = 30)
    private String contactNumber;

    @Column(length = 255)
    private String landmark;

    // ─── Schedule ───
    @Column(name = "preferred_date")
    private LocalDate preferredDate;

    @Column(name = "preferred_time_slot", length = 50)
    private String preferredTimeSlot;

    @Column(name = "is_flexible_schedule", nullable = false)
    private boolean flexibleSchedule = true;

    // ─── Urgency ───
    @Column(name = "is_emergency", nullable = false)
    private boolean emergency = false;

    @Column(name = "urgency_level", length = 20, nullable = false)
    private String urgencyLevel = "NORMAL"; // NORMAL, URGENT, EMERGENCY

    @Column(name = "pickup_needed", nullable = false)
    private boolean pickupNeeded = false;

    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "request", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("request-media")
    private List<RepairMedia> media = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // ─── Getters & Setters ───
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDeviceType() { return deviceType; }
    public void setDeviceType(String deviceType) { this.deviceType = deviceType; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getDeviceModel() { return deviceModel; }
    public void setDeviceModel(String deviceModel) { this.deviceModel = deviceModel; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getServiceLocation() { return serviceLocation; }
    public void setServiceLocation(String serviceLocation) { this.serviceLocation = serviceLocation; }
    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }
    public String getLandmark() { return landmark; }
    public void setLandmark(String landmark) { this.landmark = landmark; }
    public LocalDate getPreferredDate() { return preferredDate; }
    public void setPreferredDate(LocalDate preferredDate) { this.preferredDate = preferredDate; }
    public String getPreferredTimeSlot() { return preferredTimeSlot; }
    public void setPreferredTimeSlot(String preferredTimeSlot) { this.preferredTimeSlot = preferredTimeSlot; }
    public boolean isFlexibleSchedule() { return flexibleSchedule; }
    public void setFlexibleSchedule(boolean flexibleSchedule) { this.flexibleSchedule = flexibleSchedule; }
    public boolean isEmergency() { return emergency; }
    public void setEmergency(boolean emergency) { this.emergency = emergency; }
    public String getUrgencyLevel() { return urgencyLevel; }
    public void setUrgencyLevel(String urgencyLevel) { this.urgencyLevel = urgencyLevel; }
    public boolean isPickupNeeded() { return pickupNeeded; }
    public void setPickupNeeded(boolean pickupNeeded) { this.pickupNeeded = pickupNeeded; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<RepairMedia> getMedia() { return media; }
    public void setMedia(List<RepairMedia> media) { this.media = media; }
}
