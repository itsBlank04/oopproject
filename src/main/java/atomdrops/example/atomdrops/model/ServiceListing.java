package atomdrops.example.atomdrops.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import atomdrops.example.atomdrops.model.enums.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "service_listings")
public class ServiceListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private Technician technician;

    @Column(length = 120, nullable = false)
    private String category;

    @Column(name = "price_min_bdt", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceMinBdt;

    @Column(name = "price_max_bdt", nullable = false, precision = 12, scale = 2)
    private BigDecimal priceMaxBdt;

    @Column(name = "availability_note", length = 255)
    private String availabilityNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceStatus status = ServiceStatus.ACTIVE;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public ServiceListing() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Technician getTechnician() {
        return technician;
    }

    public void setTechnician(Technician technician) {
        this.technician = technician;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public BigDecimal getPriceMinBdt() {
        return priceMinBdt;
    }

    public void setPriceMinBdt(BigDecimal priceMinBdt) {
        this.priceMinBdt = priceMinBdt;
    }

    public BigDecimal getPriceMaxBdt() {
        return priceMaxBdt;
    }

    public void setPriceMaxBdt(BigDecimal priceMaxBdt) {
        this.priceMaxBdt = priceMaxBdt;
    }

    public String getAvailabilityNote() {
        return availabilityNote;
    }

    public void setAvailabilityNote(String availabilityNote) {
        this.availabilityNote = availabilityNote;
    }

    public ServiceStatus getStatus() {
        return status;
    }

    public void setStatus(ServiceStatus status) {
        this.status = status;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
