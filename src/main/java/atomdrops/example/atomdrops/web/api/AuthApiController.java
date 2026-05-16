package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.service.AuthService;
import atomdrops.example.atomdrops.web.dto.AuthResponse;
import atomdrops.example.atomdrops.web.dto.LoginRequest;
import atomdrops.example.atomdrops.web.dto.RegisterRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthApiController {

    public static final String SESSION_USER_ID = "userId";
    public static final String SESSION_ROLE = "role";

    private final AuthService authService;

    public AuthApiController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, HttpSession session) {
        try {
            User user = authService.register(request);
            String role = authService.resolveUserRole(user.getId());
            session.setAttribute(SESSION_USER_ID, user.getId());
            session.setAttribute(SESSION_ROLE, role);
            return ResponseEntity.ok(new AuthResponse(user, role));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PostMapping("/setup-admin")
    public ResponseEntity<?> setupAdmin(@Valid @RequestBody RegisterRequest request, HttpSession session) {
        try {
            User user = authService.registerAsAdmin(request);
            String role = authService.resolveUserRole(user.getId());
            session.setAttribute(SESSION_USER_ID, user.getId());
            session.setAttribute(SESSION_ROLE, role);
            return ResponseEntity.ok(new AuthResponse(user, role));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest()
                .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpSession session) {
        Optional<User> userOpt = authService.authenticate(request);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Invalid email or password"));
        }

        User user = userOpt.get();
        String role = authService.resolveUserRole(user.getId());

        session.setAttribute(SESSION_USER_ID, user.getId());
        session.setAttribute(SESSION_ROLE, role);

        return ResponseEntity.ok(new AuthResponse(user, role));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Long userId = (Long) session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Not authenticated"));
        }

        String role = (String) session.getAttribute(SESSION_ROLE);
        Optional<User> userOpt = authService.findById(userId);
        if (userOpt.isEmpty()) {
            session.invalidate();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("User not found"));
        }

        return ResponseEntity.ok(new AuthResponse(userOpt.get(), role != null ? role : authService.resolveUserRole(userId)));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(new MessageResponse("Logged out"));
    }

    record ErrorResponse(String message) {}
    record MessageResponse(String message) {}
}
