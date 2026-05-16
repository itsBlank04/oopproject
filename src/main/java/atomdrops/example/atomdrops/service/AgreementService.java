package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.UserAgreement;
import atomdrops.example.atomdrops.model.enums.AgreementType;
import atomdrops.example.atomdrops.repository.UserAgreementRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AgreementService {

    private final UserAgreementRepository userAgreementRepository;
    private final UserRepository userRepository;

    public AgreementService(UserAgreementRepository userAgreementRepository, UserRepository userRepository) {
        this.userAgreementRepository = userAgreementRepository;
        this.userRepository = userRepository;
    }

    public UserAgreement accept(Long userId, AgreementType type, String ipAddress) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<UserAgreement> existing = userAgreementRepository.findByUser_Id(userId);
        if (existing.stream().anyMatch(a -> a.getAgreementType() == type)) {
            throw new IllegalArgumentException("Agreement already accepted");
        }
        UserAgreement ua = new UserAgreement();
        ua.setUser(user);
        ua.setAgreementType(type);
        ua.setIpAddress(ipAddress);
        return userAgreementRepository.save(ua);
    }

    @Transactional(readOnly = true)
    public boolean hasAccepted(Long userId, AgreementType type) {
        return userAgreementRepository.findByUser_Id(userId).stream()
            .anyMatch(a -> a.getAgreementType() == type);
    }

    @Transactional(readOnly = true)
    public List<UserAgreement> getAgreements(Long userId) {
        return userAgreementRepository.findByUser_Id(userId);
    }
}
