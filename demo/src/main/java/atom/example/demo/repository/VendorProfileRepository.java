package atom.example.demo.repository;
import atom.example.demo.model.VendorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface VendorProfileRepository extends JpaRepository<VendorProfile, Long> {
    Optional<VendorProfile> findByUserId(Long userId);
    Optional<VendorProfile> findByShopSlug(String shopSlug);
}
