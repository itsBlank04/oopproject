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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "technician_earnings")
public class TechnicianEarning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private Technician technician;

    @OneToOne
    @JoinColumn(name = "booking_id")
    private RepairBooking booking;

    @Column(name = "gross_amount_bdt", nullable = false)
    private BigDecimal grossAmountBdt;

    @Column(name = "commission_rate", nullable = false)
    private BigDecimal commissionRate;

    @Column(name = "commission_bdt", nullable = false)
    private BigDecimal commissionBdt;

    @Column(name = "net_amount_bdt", nullable = false)
    private BigDecimal netAmountBdt;

    @Column(nullable = false)
    private String status = "PENDING";

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
    public Technician getTechnician() { return technician; }
    public void setTechnician(Technician technician) { this.technician = technician; }
    public RepairBooking getBooking() { return booking; }
    public void setBooking(RepairBooking booking) { this.booking = booking; }
    public BigDecimal getGrossAmountBdt() { return grossAmountBdt; }
    public void setGrossAmountBdt(BigDecimal grossAmountBdt) { this.grossAmountBdt = grossAmountBdt; }
    public BigDecimal getCommissionRate() { return commissionRate; }
    public void setCommissionRate(BigDecimal commissionRate) { this.commissionRate = commissionRate; }
    public BigDecimal getCommissionBdt() { return commissionBdt; }
    public void setCommissionBdt(BigDecimal commissionBdt) { this.commissionBdt = commissionBdt; }
    public BigDecimal getNetAmountBdt() { return netAmountBdt; }
    public void setNetAmountBdt(BigDecimal netAmountBdt) { this.netAmountBdt = netAmountBdt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
