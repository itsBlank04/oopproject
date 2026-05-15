package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Return;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReturnRepository extends JpaRepository<Return, Long> {
    List<Return> findByCustomer_Id(Long customerId);
}
