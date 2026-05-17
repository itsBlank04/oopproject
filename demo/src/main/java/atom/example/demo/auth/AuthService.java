package atom.example.demo.auth;

import atom.example.demo.model.PlatformSetting;
import atom.example.demo.model.Role;
import atom.example.demo.model.TrustScore;
import atom.example.demo.model.User;
import atom.example.demo.repository.PlatformSettingRepository;
import atom.example.demo.repository.RoleRepository;
import atom.example.demo.repository.TrustScoreRepository;
import atom.example.demo.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TrustScoreRepository trustScoreRepository;
    private final PlatformSettingRepository platformSettingRepository;

    public AuthService(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder, TrustScoreRepository trustScoreRepository, PlatformSettingRepository platformSettingRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.trustScoreRepository = trustScoreRepository;
        this.platformSettingRepository = platformSettingRepository;
    }

    @Transactional
    public User register(String email, String password, String displayName, List<String> requestedRoles) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Always include CUSTOMER role
        Set<Role> roles = new HashSet<>();
        Role customerRole = roleRepository.findByName(Role.ROLE_CUSTOMER)
            .orElseGet(() -> roleRepository.save(new Role(Role.ROLE_CUSTOMER)));
        roles.add(customerRole);

        // Add additional requested roles (VENDOR, TECHNICIAN — never ADMIN via registration)
        if (requestedRoles != null) {
            for (String roleName : requestedRoles) {
                String normalized = roleName.toUpperCase().trim();
                if ("ADMIN".equals(normalized)) continue; // Cannot self-assign ADMIN
                roleRepository.findByName(normalized).ifPresent(roles::add);
            }
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setDisplayName(displayName);
        user.setStatus("ACTIVE");
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        // Create trust score
        int initialScore = 50;
        Optional<PlatformSetting> setting = platformSettingRepository.findById("trust.initial_score");
        if (setting.isPresent()) {
            initialScore = new BigDecimal(setting.get().getValue()).intValue();
        }

        TrustScore trustScore = new TrustScore();
        trustScore.setUser(savedUser);
        trustScore.setScore(BigDecimal.valueOf(initialScore));
        trustScoreRepository.save(trustScore);

        return savedUser;
    }

    public User authenticate(String email, String password) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new IllegalArgumentException("Account is " + user.getStatus().toLowerCase());
        }

        return user;
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User update(User user) {
        return userRepository.save(user);
    }
}
