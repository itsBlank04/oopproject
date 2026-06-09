package atom.example.demo.repository;

import atom.example.demo.model.ShopStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopStaffRepository extends JpaRepository<ShopStaff, Long> {
    List<ShopStaff> findByShopId(Long shopId);
    List<ShopStaff> findByUserId(Long userId);
    Optional<ShopStaff> findByShopIdAndUserId(Long shopId, Long userId);
    boolean existsByShopIdAndUserId(Long shopId, Long userId);
}
