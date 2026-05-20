package atom.example.demo.repository;
import atom.example.demo.model.VendorCommission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendorCommissionRepository extends JpaRepository<VendorCommission, Long> {
    List<VendorCommission> findByVendorId(Long vendorId);
    List<VendorCommission> findByStatus(String status);
    @Query("SELECT vc FROM VendorCommission vc WHERE vc.orderItem.order.id = :orderId")
    List<VendorCommission> findByOrderId(@Param("orderId") Long orderId);
}
