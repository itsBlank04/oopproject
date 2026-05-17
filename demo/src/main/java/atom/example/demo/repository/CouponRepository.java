package atom.example.demo.repository;
import atom.example.demo.model.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeAndIsActiveTrue(String code);
}
