package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.ServiceCompletion;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceCompletionRepository extends JpaRepository<ServiceCompletion, Long> {
    Optional<ServiceCompletion> findByBooking_Id(Long bookingId);
}
