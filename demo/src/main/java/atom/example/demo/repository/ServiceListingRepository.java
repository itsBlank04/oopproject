package atom.example.demo.repository;
import atom.example.demo.model.ServiceListing;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ServiceListingRepository extends JpaRepository<ServiceListing, Long> {
    List<ServiceListing> findByTechnicianId(Long technicianId);
    List<ServiceListing> findByCategoryId(Long categoryId);
    List<ServiceListing> findByStatus(String status);
}
