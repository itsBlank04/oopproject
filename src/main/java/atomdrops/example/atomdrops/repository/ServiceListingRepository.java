package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.ServiceListing;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceListingRepository extends JpaRepository<ServiceListing, Long> {
    List<ServiceListing> findByTechnician_Id(Long technicianId);
}
