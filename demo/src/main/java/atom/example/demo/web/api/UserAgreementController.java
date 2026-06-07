package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.UserAgreement;
import atom.example.demo.repository.UserAgreementRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/agreements")
public class UserAgreementController {

    private final UserAgreementRepository userAgreementRepository;
    private final UserRepository userRepository;

    public UserAgreementController(UserAgreementRepository userAgreementRepository,
                                   UserRepository userRepository) {
        this.userAgreementRepository = userAgreementRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/{type}")
    public Map<String, Object> status(@PathVariable String type) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        boolean accepted = userAgreementRepository.existsByUserIdAndAgreementType(userId, type);
        return Map.of("type", type, "accepted", accepted);
    }

    @PostMapping("/{type}")
    public Map<String, Object> accept(@PathVariable String type, HttpServletRequest request) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        boolean exists = userAgreementRepository.existsByUserIdAndAgreementType(userId, type);
        if (!exists) {
            UserAgreement agreement = new UserAgreement();
            agreement.setUser(userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found")));
            agreement.setAgreementType(type);
            agreement.setIpAddress(request.getRemoteAddr());
            userAgreementRepository.save(agreement);
        }
        return Map.of("type", type, "accepted", true);
    }
}
