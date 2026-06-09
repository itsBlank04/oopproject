package atom.example.demo.repository;

import atom.example.demo.model.VendorSubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VendorSubscriptionPlanRepository extends JpaRepository<VendorSubscriptionPlan, Long> {
    Optional<VendorSubscriptionPlan> findByName(String name);
}
