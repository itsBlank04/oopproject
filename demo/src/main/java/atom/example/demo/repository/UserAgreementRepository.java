package atom.example.demo.repository;
import atom.example.demo.model.UserAgreement;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserAgreementRepository extends JpaRepository<UserAgreement, Long> {
    boolean existsByUserIdAndAgreementType(Long userId, String agreementType);
}
