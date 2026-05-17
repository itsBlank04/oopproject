package atom.example.demo.repository;
import atom.example.demo.model.CouponUse;
import org.springframework.data.jpa.repository.JpaRepository;
public interface CouponUseRepository extends JpaRepository<CouponUse, Long> {
    boolean existsByCouponIdAndUserId(Long couponId, Long userId);
}
