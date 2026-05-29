package atom.example.demo.repository;
import atom.example.demo.model.VendorCommission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendorCommissionRepository extends JpaRepository<VendorCommission, Long> {
    @Query("SELECT vc FROM VendorCommission vc JOIN FETCH vc.orderItem oi JOIN FETCH oi.order LEFT JOIN FETCH oi.product WHERE vc.vendor.id = :vendorId")
    List<VendorCommission> findByVendorId(@Param("vendorId") Long vendorId);
    List<VendorCommission> findByStatus(String status);
    @Query("SELECT vc FROM VendorCommission vc WHERE vc.orderItem.order.id = :orderId")
    List<VendorCommission> findByOrderId(@Param("orderId") Long orderId);
    @Query("SELECT COUNT(vc) > 0 FROM VendorCommission vc WHERE vc.vendor.id = :vendorId AND vc.orderItem.order.id = :orderId")
    boolean existsByVendorIdAndOrderId(@Param("vendorId") Long vendorId, @Param("orderId") Long orderId);
}
