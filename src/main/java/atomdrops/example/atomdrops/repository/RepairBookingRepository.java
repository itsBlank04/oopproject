package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.RepairBooking;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairBookingRepository extends JpaRepository<RepairBooking, Long> {
    List<RepairBooking> findByTechnician_Id(Long technicianId);
}
