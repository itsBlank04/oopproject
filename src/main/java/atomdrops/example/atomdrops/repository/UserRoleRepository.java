package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.UserRole;
import atomdrops.example.atomdrops.model.UserRole.UserRoleId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
    List<UserRole> findByUserId(Long userId);
}
