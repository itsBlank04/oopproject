package atom.example.demo.repository;

import atom.example.demo.model.RoleUpgrade;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleUpgradeRepository extends JpaRepository<RoleUpgrade, Long> {
    Optional<RoleUpgrade> findByUserIdAndRole(Long userId, String role);
    List<RoleUpgrade> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<RoleUpgrade> findAllByOrderByCreatedAtDesc();
    List<RoleUpgrade> findByStatusOrderByCreatedAtDesc(String status);
    List<RoleUpgrade> findByRoleOrderByCreatedAtDesc(String role);
    List<RoleUpgrade> findByUserId(Long userId);
}
