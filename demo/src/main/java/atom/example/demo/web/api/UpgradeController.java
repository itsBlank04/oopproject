package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.RoleUpgrade;
import atom.example.demo.model.User;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.service.UpgradeService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/upgrades")
public class UpgradeController {

    private final UpgradeService upgradeService;
    private final UserRepository userRepository;

    public UpgradeController(UpgradeService upgradeService, UserRepository userRepository) {
        this.upgradeService = upgradeService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated", "status", 401));
        }
        String role = body.get("role");
        RoleUpgrade upgrade = upgradeService.createUpgrade(userId, role);
        return ResponseEntity.ok(upgrade);
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<?> pay(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpServletRequest request) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated", "status", 401));
        }
        String method = (String) body.get("method");
        String providerRef = body.get("providerRef") != null ? body.get("providerRef").toString() : null;
        boolean success = body.get("success") == null || Boolean.TRUE.equals(body.get("success"));

        RoleUpgrade upgrade = upgradeService.payUpgrade(userId, id, method, providerRef, success);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if ("ACTIVE".equals(upgrade.getStatus())) {
            setSecurityContext(user, request);
        }
        Map<String, Object> payload = Map.of(
            "upgrade", upgrade,
            "user", user
        );
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/me")
    public ResponseEntity<?> myUpgrades() {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Not authenticated", "status", 401));
        }
        List<RoleUpgrade> upgrades = upgradeService.listUserUpgrades(userId);
        return ResponseEntity.ok(upgrades);
    }

    private void setSecurityContext(User user, HttpServletRequest request) {
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
            .toList();

        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(user.getId(), null, authorities);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        var session = request.getSession(true);
        session.setAttribute("userId", user.getId());
        session.setAttribute(
            HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
            context
        );
    }
}
