package atom.example.demo.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "repair_payments")
public class RepairPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "booking_id")
    private RepairBooking booking;

    @Column(name = "amount_bdt", nullable = false)
    private BigDecimal amountBdt;

    @Column(nullable = false)
    private String status = "PENDING";

    @Column(nullable = false)
    private String method = "DUMMY";

    @Column(name = "gateway_name")
    private String gatewayName;

    @Column(name = "transaction_ref", unique = true)
    private String transactionRef;

    @Column(name = "gateway_response", columnDefinition = "TEXT")
    private String gatewayResponse;

    @Column(name = "paid_at")
    private Instant paidAt;

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
    public RepairBooking getBooking() { return booking; }
    public void setBooking(RepairBooking booking) { this.booking = booking; }
    public BigDecimal getAmountBdt() { return amountBdt; }
    public void setAmountBdt(BigDecimal amountBdt) { this.amountBdt = amountBdt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getGatewayName() { return gatewayName; }
    public void setGatewayName(String gatewayName) { this.gatewayName = gatewayName; }
    public String getTransactionRef() { return transactionRef; }
    public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
    public String getGatewayResponse() { return gatewayResponse; }
    public void setGatewayResponse(String gatewayResponse) { this.gatewayResponse = gatewayResponse; }
    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
