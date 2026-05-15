package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Role;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.UserRole;
import atomdrops.example.atomdrops.model.enums.UserStatus;
import atomdrops.example.atomdrops.repository.RoleRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import atomdrops.example.atomdrops.repository.UserRoleRepository;
import atomdrops.example.atomdrops.web.dto.LoginRequest;
import atomdrops.example.atomdrops.web.dto.RegisterRequest;
import java.util.Locale;
import java.util.Optional;
import java.util.List;
import java.util.ArrayList;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_VENDOR = "VENDOR";
    public static final String ROLE_CUSTOMER = "CUSTOMER";
    public static final String ROLE_TECHNICIAN = "TECHNICIAN";

    private static final List<String> ROLE_PRIORITY = List.of(ROLE_ADMIN, ROLE_VENDOR, ROLE_TECHNICIAN, ROLE_CUSTOMER);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordService passwordService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            PasswordService passwordService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.passwordService = passwordService;
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail().toLowerCase(Locale.ROOT));
        user.setDisplayName(request.getDisplayName().trim());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordService.hash(request.getPassword()));
        user = userRepository.save(user);

        Role role = findOrCreateRole(request.getRole());
        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        userRoleRepository.save(userRole);

        return user;
    }

    @Transactional(readOnly = true)
    public Optional<User> authenticate(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().toLowerCase(Locale.ROOT));
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        User user = userOpt.get();
        if (!passwordService.matches(request.getPassword(), user.getPasswordHash())) {
            return Optional.empty();
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            return Optional.empty();
        }

        return Optional.of(user);
    }

    @Transactional(readOnly = true)
    public String resolveUserRole(Long userId) {
        List<UserRole> userRoles = userRoleRepository.findByUser_Id(userId);
        if (userRoles.isEmpty()) {
            return ROLE_CUSTOMER;
        }

        List<Role> roles = roleRepository.findAllById(
            userRoles.stream().map(ur -> ur.getRole().getId()).toList()
        );

        for (String priorityRole : ROLE_PRIORITY) {
            for (Role role : roles) {
                if (role.getName().equalsIgnoreCase(priorityRole)) {
                    return role.getName().toUpperCase(Locale.ROOT);
                }
            }
        }

        return ROLE_CUSTOMER;
    }

    @Transactional(readOnly = true)
    public boolean hasRole(Long userId, String roleName) {
        String normalized = roleName.trim().toUpperCase(Locale.ROOT);
        List<UserRole> userRoles = userRoleRepository.findByUser_Id(userId);
        if (userRoles.isEmpty()) {
            return false;
        }

        List<Long> roleIds = userRoles.stream()
            .map(ur -> ur.getRole().getId())
            .toList();
        List<Role> roles = roleRepository.findAllById(roleIds);

        return roles.stream().anyMatch(r -> r.getName().equalsIgnoreCase(normalized));
    }

    @Transactional
    public User registerAsAdmin(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail().toLowerCase(Locale.ROOT));
        user.setDisplayName(request.getDisplayName().trim());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordService.hash(request.getPassword()));
        user = userRepository.save(user);

        Role role = findOrCreateRole(ROLE_ADMIN);
        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        userRoleRepository.save(userRole);

        return user;
    }

    @Transactional
    public User registerAsAdmin(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setEmail(request.getEmail().toLowerCase(Locale.ROOT));
        user.setDisplayName(request.getDisplayName().trim());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordService.hash(request.getPassword()));
        user = userRepository.save(user);

        Role role = findOrCreateRole(ROLE_ADMIN);
        UserRole userRole = new UserRole();
        userRole.setUserId(user.getId());
        userRole.setRoleId(role.getId());
        userRoleRepository.save(userRole);

        return user;
    }

    private Role findOrCreateRole(String rawRole) {
        String roleName = rawRole.trim().toUpperCase(Locale.ROOT);
        if (!roleName.equals(ROLE_CUSTOMER)
                && !roleName.equals(ROLE_VENDOR)
                && !roleName.equals(ROLE_TECHNICIAN)
                && !roleName.equals(ROLE_ADMIN)) {
            roleName = ROLE_CUSTOMER;
        }
        String finalRoleName = roleName;
        return roleRepository.findByName(finalRoleName)
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setName(finalRoleName);
                    return roleRepository.save(role);
                });
    }
}
