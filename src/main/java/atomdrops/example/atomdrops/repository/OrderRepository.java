package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Order;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomer_Id(Long customerId);
    Page<Order> findByCustomer_Id(Long customerId, Pageable pageable);
}
