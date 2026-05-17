package atom.example.demo.repository;
import atom.example.demo.model.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {
    List<UserBadge> findByUserIdAndIsActiveTrue(Long userId);
}
