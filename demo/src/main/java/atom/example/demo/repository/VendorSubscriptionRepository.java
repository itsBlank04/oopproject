package atom.example.demo.repository;

import atom.example.demo.model.VendorSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface VendorSubscriptionRepository extends JpaRepository<VendorSubscription, Long> {
    Optional<VendorSubscription> findByVendorId(Long vendorId);
    List<VendorSubscription> findByStatusAndExpiresAtBefore(String status, Instant expiresAt);
    List<VendorSubscription> findByStatusAndGracePeriodEndsBefore(String status, Instant gracePeriodEnds);
    List<VendorSubscription> findByExpiresAtBetween(Instant start, Instant end);
}
