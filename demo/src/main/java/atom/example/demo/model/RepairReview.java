package atom.example.demo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "repair_reviews")
public class RepairReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private RepairBooking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id", nullable = false)
    private Technician technician;

    @Column(name = "work_quality", nullable = false)
    private int workQuality; // 1-5

    @Column(nullable = false)
    private int professionalism; // 1-5

    @Column(nullable = false)
    private int communication; // 1-5

    @Column(nullable = false)
    private int timeliness; // 1-5

    @Column(name = "pricing_fairness", nullable = false)
    private int pricingFairness; // 1-5

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RepairBooking getBooking() { return booking; }
    public void setBooking(RepairBooking booking) { this.booking = booking; }
    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }
    public Technician getTechnician() { return technician; }
    public void setTechnician(Technician technician) { this.technician = technician; }
    public int getWorkQuality() { return workQuality; }
    public void setWorkQuality(int workQuality) { this.workQuality = workQuality; }
    public int getProfessionalism() { return professionalism; }
    public void setProfessionalism(int professionalism) { this.professionalism = professionalism; }
    public int getCommunication() { return communication; }
    public void setCommunication(int communication) { this.communication = communication; }
    public int getTimeliness() { return timeliness; }
    public void setTimeliness(int timeliness) { this.timeliness = timeliness; }
    public int getPricingFairness() { return pricingFairness; }
    public void setPricingFairness(int pricingFairness) { this.pricingFairness = pricingFairness; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public Instant getCreatedAt() { return createdAt; }
}
