package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.RepairBooking;
import atomdrops.example.atomdrops.model.enums.BookingStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepairBookingRepository extends JpaRepository<RepairBooking, Long> {
    List<RepairBooking> findByTechnician_Id(Long technicianId);
    Optional<RepairBooking> findFirstByRequest_IdOrderByUpdatedAtDesc(Long requestId);
    boolean existsByStatusAndRequest_Customer_IdAndTechnician_User_Id(BookingStatus status, Long customerId, Long technicianUserId);
}
