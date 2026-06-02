package atom.example.demo.repository;
import atom.example.demo.model.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserIdAndStatus(Long userId, String status);
    List<Cart> findByStatusAndUpdatedAtBefore(String status, Instant before);
    List<Cart> findByStatus(String status);
    Cart findByUserId(Long userId);
}
