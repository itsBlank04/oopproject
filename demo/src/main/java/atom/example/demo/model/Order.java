package atom.example.demo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shipping_address_id")
    private Address shippingAddress;

    private String shippingAddressSnapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    private Coupon coupon;

    private BigDecimal subtotalBdt;

    private BigDecimal shippingFeeBdt = BigDecimal.ZERO;

    private BigDecimal discountBdt = BigDecimal.ZERO;

    private BigDecimal taxBdt = BigDecimal.ZERO;

    private BigDecimal totalBdt;

    private String status = "PLACED";

    @Column(name = "shipping_option", length = 20)
    private String shippingOption;

    @Column(columnDefinition = "TEXT")
    private String note;

    private Instant createdAt;

    private Instant updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<OrderItem> items = new ArrayList<>();

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

    public User getCustomer() {
        return customer;
    }

    public void setCustomer(User customer) {
        this.customer = customer;
    }

    public Address getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(Address shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public String getShippingAddressSnapshot() {
        return shippingAddressSnapshot;
    }

    public void setShippingAddressSnapshot(String shippingAddressSnapshot) {
        this.shippingAddressSnapshot = shippingAddressSnapshot;
    }

    public Coupon getCoupon() {
        return coupon;
    }

    public void setCoupon(Coupon coupon) {
        this.coupon = coupon;
    }

    public BigDecimal getSubtotalBdt() {
        return subtotalBdt;
    }

    public void setSubtotalBdt(BigDecimal subtotalBdt) {
        this.subtotalBdt = subtotalBdt;
    }

    public BigDecimal getShippingFeeBdt() {
        return shippingFeeBdt;
    }

    public void setShippingFeeBdt(BigDecimal shippingFeeBdt) {
        this.shippingFeeBdt = shippingFeeBdt;
    }

    public BigDecimal getDiscountBdt() {
        return discountBdt;
    }

    public void setDiscountBdt(BigDecimal discountBdt) {
        this.discountBdt = discountBdt;
    }

    public BigDecimal getTaxBdt() {
        return taxBdt;
    }

    public void setTaxBdt(BigDecimal taxBdt) {
        this.taxBdt = taxBdt;
    }

    public BigDecimal getTotalBdt() {
        return totalBdt;
    }

    public void setTotalBdt(BigDecimal totalBdt) {
        this.totalBdt = totalBdt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getShippingOption() {
        return shippingOption;
    }

    public void setShippingOption(String shippingOption) {
        this.shippingOption = shippingOption;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
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

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}
