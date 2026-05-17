package atom.example.demo.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "coupon_uses")
public class CouponUse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "order_id")
    private Long orderRef;

    @Column(name = "used_at")
    private Instant usedAt;

    @PrePersist
    public void prePersist() {
        if (usedAt == null) {
            this.usedAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Coupon getCoupon() {
        return coupon;
    }

    public void setCoupon(Coupon coupon) {
        this.coupon = coupon;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Long getOrderRef() {
        return orderRef;
    }

    public void setOrderRef(Long orderRef) {
        this.orderRef = orderRef;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public void setUsedAt(Instant usedAt) {
        this.usedAt = usedAt;
    }
}
