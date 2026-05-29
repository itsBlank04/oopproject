package atom.example.demo.service;

import atom.example.demo.model.Role;
import atom.example.demo.model.RoleUpgrade;
import atom.example.demo.model.UpgradePayment;
import atom.example.demo.model.User;
import atom.example.demo.repository.RoleRepository;
import atom.example.demo.repository.RoleUpgradeRepository;
import atom.example.demo.repository.UpgradePaymentRepository;
import atom.example.demo.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpgradeService {

    private static final BigDecimal UPGRADE_FEE = new BigDecimal("99.00");

    private final RoleUpgradeRepository roleUpgradeRepository;
    private final UpgradePaymentRepository upgradePaymentRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UpgradeService(RoleUpgradeRepository roleUpgradeRepository,
                          UpgradePaymentRepository upgradePaymentRepository,
                          UserRepository userRepository,
                          RoleRepository roleRepository) {
        this.roleUpgradeRepository = roleUpgradeRepository;
        this.upgradePaymentRepository = upgradePaymentRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Transactional
    public RoleUpgrade createUpgrade(Long userId, String role) {
        String normalized = normalizeRole(role);
        if (!isUpgradeableRole(normalized)) {
            throw new IllegalArgumentException("Invalid role upgrade request");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getRoles().stream().anyMatch(r -> r.getName().equals(normalized))) {
            throw new IllegalArgumentException("Role already granted");
        }

        RoleUpgrade existing = roleUpgradeRepository.findByUserIdAndRole(userId, normalized).orElse(null);
        if (existing != null) {
            if (List.of("PENDING_PAYMENT", "PAID", "ACTIVE").contains(existing.getStatus())) {
                return existing;
            }
            existing.setAmountBdt(UPGRADE_FEE);
            existing.setStatus("PENDING_PAYMENT");
            existing.setActivatedAt(null);
            return roleUpgradeRepository.save(existing);
        }

        RoleUpgrade upgrade = new RoleUpgrade();
        upgrade.setUser(user);
        upgrade.setRole(normalized);
        upgrade.setAmountBdt(UPGRADE_FEE);
        upgrade.setStatus("PENDING_PAYMENT");
        return roleUpgradeRepository.save(upgrade);
    }

    @Transactional
    public RoleUpgrade payUpgrade(Long userId, Long upgradeId, String method, String providerRef, boolean success) {
        RoleUpgrade upgrade = roleUpgradeRepository.findById(upgradeId)
            .orElseThrow(() -> new IllegalArgumentException("Upgrade request not found"));
        if (!upgrade.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Not your upgrade request");
        }

        UpgradePayment payment = new UpgradePayment();
        payment.setUpgrade(upgrade);
        payment.setUser(upgrade.getUser());
        payment.setAmountBdt(upgrade.getAmountBdt());
        payment.setMethod(normalizeMethod(method));
        payment.setCurrency("BDT");
        payment.setStatus(success ? "SUCCESS" : "FAILED");
        payment.setProviderRef(providerRef);
        upgradePaymentRepository.save(payment);

        if (!success) {
            upgrade.setStatus("FAILED");
            return roleUpgradeRepository.save(upgrade);
        }

        if (!"ACTIVE".equals(upgrade.getStatus())) {
            upgrade.setStatus("PAID");
            grantRole(upgrade.getUser(), upgrade.getRole());
            upgrade.setStatus("ACTIVE");
            upgrade.setActivatedAt(Instant.now());
        }

        return roleUpgradeRepository.save(upgrade);
    }

    public List<RoleUpgrade> listUserUpgrades(Long userId) {
        return roleUpgradeRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    private void grantRole(User user, String roleName) {
        Role role = roleRepository.findByName(roleName)
            .orElseGet(() -> roleRepository.save(new Role(roleName)));
        Set<Role> roles = user.getRoles();
        roles.add(role);
        user.setRoles(roles);
        userRepository.save(user);
    }

    private String normalizeRole(String role) {
        return role == null ? "" : role.trim().toUpperCase();
    }

    private boolean isUpgradeableRole(String role) {
        return Role.ROLE_VENDOR.equals(role) || Role.ROLE_TECHNICIAN.equals(role);
    }

    private String normalizeMethod(String method) {
        String normalized = method == null ? "" : method.trim().toUpperCase();
        if (!List.of("BKASH", "NAGAD", "CARD").contains(normalized)) {
            throw new IllegalArgumentException("Invalid payment method");
        }
        return normalized;
    }
}
