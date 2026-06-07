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

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "repair_bookings")
public class RepairBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "request_id")
    private RepairRequest request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private Technician technician;

    @Column(name = "work_order_id", unique = true, length = 20)
    private String workOrderId;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time_slot", length = 50)
    private String scheduledTimeSlot;

    // CONFIRMED → SCHEDULED → IN_PROGRESS → AWAITING_PARTS → COMPLETED → CLOSED
    @Column(nullable = false, length = 30)
    private String status = "CONFIRMED";

    @Column(name = "warranty_days", nullable = false)
    private int warrantyDays = 0;

    @Column(name = "warranty_expires_at")
    private Instant warrantyExpiresAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (workOrderId == null) {
            workOrderId = "WO-" + System.currentTimeMillis() % 1_000_000;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public RepairRequest getRequest() { return request; }
    public void setRequest(RepairRequest request) { this.request = request; }
    public Technician getTechnician() { return technician; }
    public void setTechnician(Technician technician) { this.technician = technician; }
    public String getWorkOrderId() { return workOrderId; }
    public void setWorkOrderId(String workOrderId) { this.workOrderId = workOrderId; }
    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }
    public String getScheduledTimeSlot() { return scheduledTimeSlot; }
    public void setScheduledTimeSlot(String scheduledTimeSlot) { this.scheduledTimeSlot = scheduledTimeSlot; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getWarrantyDays() { return warrantyDays; }
    public void setWarrantyDays(int warrantyDays) { this.warrantyDays = warrantyDays; }
    public Instant getWarrantyExpiresAt() { return warrantyExpiresAt; }
    public void setWarrantyExpiresAt(Instant warrantyExpiresAt) { this.warrantyExpiresAt = warrantyExpiresAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
