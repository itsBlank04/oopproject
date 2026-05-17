package atom.example.demo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "vendor_commissions")
public class VendorCommission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private User vendor;

    @Column(name = "sale_amount_bdt")
    private BigDecimal saleAmountBdt;

    @Column(name = "commission_rate")
    private BigDecimal commissionRate;

    @Column(name = "commission_bdt")
    private BigDecimal commissionBdt;

    @Column(name = "net_payout_bdt")
    private BigDecimal netPayoutBdt;

    private String status = "PENDING";

    private Instant createdAt;

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

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public OrderItem getOrderItem() {
        return orderItem;
    }

    public void setOrderItem(OrderItem orderItem) {
        this.orderItem = orderItem;
    }

    public User getVendor() {
        return vendor;
    }

    public void setVendor(User vendor) {
        this.vendor = vendor;
    }

    public BigDecimal getSaleAmountBdt() {
        return saleAmountBdt;
    }

    public void setSaleAmountBdt(BigDecimal saleAmountBdt) {
        this.saleAmountBdt = saleAmountBdt;
    }

    public BigDecimal getCommissionRate() {
        return commissionRate;
    }

    public void setCommissionRate(BigDecimal commissionRate) {
        this.commissionRate = commissionRate;
    }

    public BigDecimal getCommissionBdt() {
        return commissionBdt;
    }

    public void setCommissionBdt(BigDecimal commissionBdt) {
        this.commissionBdt = commissionBdt;
    }

    public BigDecimal getNetPayoutBdt() {
        return netPayoutBdt;
    }

    public void setNetPayoutBdt(BigDecimal netPayoutBdt) {
        this.netPayoutBdt = netPayoutBdt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
