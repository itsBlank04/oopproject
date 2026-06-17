package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.UserAgreement;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAgreementRepository extends JpaRepository<UserAgreement, Long> {
    List<UserAgreement> findByUser_Id(Long userId);
}
