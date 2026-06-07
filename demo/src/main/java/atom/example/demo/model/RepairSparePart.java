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

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "repair_spare_parts")
public class RepairSparePart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private RepairBooking booking;

    @Column(name = "part_name", nullable = false, length = 200)
    private String partName;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(name = "price_bdt", nullable = false)
    private BigDecimal priceBdt;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "approved_by_customer", nullable = false)
    private boolean approvedByCustomer = false;

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
    public String getPartName() { return partName; }
    public void setPartName(String partName) { this.partName = partName; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public BigDecimal getPriceBdt() { return priceBdt; }
    public void setPriceBdt(BigDecimal priceBdt) { this.priceBdt = priceBdt; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public boolean isApprovedByCustomer() { return approvedByCustomer; }
    public void setApprovedByCustomer(boolean approvedByCustomer) { this.approvedByCustomer = approvedByCustomer; }
    public Instant getCreatedAt() { return createdAt; }
}
