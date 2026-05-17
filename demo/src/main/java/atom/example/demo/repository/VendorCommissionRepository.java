package atom.example.demo.repository;
import atom.example.demo.model.VendorCommission;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface VendorCommissionRepository extends JpaRepository<VendorCommission, Long> {
    List<VendorCommission> findByVendorId(Long vendorId);
    List<VendorCommission> findByStatus(String status);
}
