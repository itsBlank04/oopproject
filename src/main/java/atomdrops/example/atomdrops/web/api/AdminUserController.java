package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.enums.UserStatus;
import atomdrops.example.atomdrops.repository.UserRepository;
import atomdrops.example.atomdrops.service.AuthService;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    public AdminUserController(UserRepository userRepository, AuthService authService) {
        this.userRepository = userRepository;
        this.authService = authService;
    }

    private boolean isAdmin(HttpSession session) {
        return "ADMIN".equals(session.getAttribute("role"));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<?> banUser(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(UserStatus.BANNED);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User banned"));
    }

    @PostMapping("/{id}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User unbanned"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id, HttpSession session) {
        if (!isAdmin(session)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return userRepository.findById(id)
            .map(user -> {
                String role = authService.resolveUserRole(id);
                return ResponseEntity.ok(Map.of("user", user, "role", role));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}
