package atom.example.demo.service;

import atom.example.demo.model.Coupon;
import atom.example.demo.repository.CouponRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class CouponService {

    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public Coupon validateCoupon(String code, BigDecimal orderAmount) {
        Coupon coupon = couponRepository.findByCodeAndIsActiveTrue(code)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or inactive coupon code"));

        if (coupon.getValidFrom() != null && Instant.now().isBefore(coupon.getValidFrom())) {
            throw new IllegalArgumentException("Coupon is not yet valid");
        }

        if (coupon.getValidUntil() != null && Instant.now().isAfter(coupon.getValidUntil())) {
            throw new IllegalArgumentException("Coupon has expired");
        }

        if (coupon.getMaxUses() != null && coupon.getUsesCount() >= coupon.getMaxUses()) {
            throw new IllegalArgumentException("Coupon usage limit reached");
        }

        if (orderAmount.compareTo(coupon.getMinOrderBdt()) < 0) {
            throw new IllegalArgumentException("Minimum order amount not met for this coupon");
        }

        return coupon;
    }

    @Transactional
    public Coupon createCoupon(Coupon coupon) {
        return couponRepository.save(coupon);
    }

    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @Transactional
    public Coupon updateCoupon(Long id, Coupon coupon) {
        Coupon existing = couponRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Coupon not found"));
        existing.setCode(coupon.getCode());
        existing.setDescription(coupon.getDescription());
        existing.setDiscountType(coupon.getDiscountType());
        existing.setDiscountValue(coupon.getDiscountValue());
        existing.setMinOrderBdt(coupon.getMinOrderBdt());
        existing.setMaxDiscountBdt(coupon.getMaxDiscountBdt());
        existing.setMaxUses(coupon.getMaxUses());
        existing.setValidFrom(coupon.getValidFrom());
        existing.setValidUntil(coupon.getValidUntil());
        existing.setIsActive(coupon.getIsActive());
        return couponRepository.save(existing);
    }
}
