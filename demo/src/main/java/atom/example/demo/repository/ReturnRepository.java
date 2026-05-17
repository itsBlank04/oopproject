package atom.example.demo.repository;
import atom.example.demo.model.Return;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ReturnRepository extends JpaRepository<Return, Long> {
    List<Return> findByCustomerId(Long customerId);
    List<Return> findByStatus(String status);
}
