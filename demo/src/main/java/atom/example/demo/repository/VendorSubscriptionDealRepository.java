package atom.example.demo.repository;

import atom.example.demo.model.VendorSubscriptionDeal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface VendorSubscriptionDealRepository extends JpaRepository<VendorSubscriptionDeal, Long> {
    List<VendorSubscriptionDeal> findByIsActiveTrueAndEndsAtAfter(Instant now);
}
