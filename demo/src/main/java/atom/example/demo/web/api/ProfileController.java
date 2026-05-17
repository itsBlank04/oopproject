package atom.example.demo.web.api;

import atom.example.demo.auth.AuthService;
import atom.example.demo.model.User;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final AuthService authService;

    public ProfileController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/profile")
    public User getProfile(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return authService.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @PutMapping("/profile")
    public User updateProfile(@RequestBody Map<String, String> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        User user = authService.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (body.containsKey("displayName")) user.setDisplayName(body.get("displayName"));
        if (body.containsKey("phone")) user.setPhone(body.get("phone"));
        if (body.containsKey("avatarUrl")) user.setAvatarUrl(body.get("avatarUrl"));
        return authService.update(user);
    }

    @GetMapping("/users/{id}/profile")
    public User getUserProfile(@PathVariable Long id) {
        return authService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
