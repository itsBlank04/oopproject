package atom.example.demo.repository;
import atom.example.demo.model.FraudFlag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface FraudFlagRepository extends JpaRepository<FraudFlag, Long> {
    List<FraudFlag> findByUserId(Long userId);
    List<FraudFlag> findByStatus(String status);
}
