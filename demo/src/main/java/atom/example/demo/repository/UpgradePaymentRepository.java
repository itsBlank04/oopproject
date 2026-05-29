package atom.example.demo.repository;

import atom.example.demo.model.UpgradePayment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UpgradePaymentRepository extends JpaRepository<UpgradePayment, Long> {
    List<UpgradePayment> findByUpgradeIdOrderByCreatedAtDesc(Long upgradeId);
}
