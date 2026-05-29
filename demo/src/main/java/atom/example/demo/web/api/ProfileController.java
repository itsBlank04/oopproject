package atom.example.demo.web.api;

import atom.example.demo.auth.AuthService;
import atom.example.demo.model.CustomerProfile;
import atom.example.demo.model.User;
import atom.example.demo.repository.CustomerProfileRepository;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final AuthService authService;
    private final CustomerProfileRepository customerProfileRepository;

    public ProfileController(AuthService authService, CustomerProfileRepository customerProfileRepository) {
        this.authService = authService;
        this.customerProfileRepository = customerProfileRepository;
    }

    @GetMapping("/profile")
    public Map<String, Object> getProfile(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        User user = authService.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        CustomerProfile profile = customerProfileRepository.findByUserId(userId).orElse(null);
        return buildProfileResponse(user, profile);
    }

    @PutMapping("/profile")
    @Transactional
    public Map<String, Object> updateProfile(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        User user = authService.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (body.containsKey("displayName")) user.setDisplayName(asString(body.get("displayName")));
        if (body.containsKey("phone")) user.setPhone(asString(body.get("phone")));
        if (body.containsKey("avatarUrl")) user.setAvatarUrl(asString(body.get("avatarUrl")));
        User savedUser = authService.update(user);

        CustomerProfile profile = customerProfileRepository.findByUserId(userId)
            .orElseGet(() -> {
                CustomerProfile created = new CustomerProfile();
                created.setUser(savedUser);
                return created;
            });
        if (body.containsKey("bio")) profile.setBio(asString(body.get("bio")));
        if (body.containsKey("location")) profile.setLocation(asString(body.get("location")));
        if (body.containsKey("websiteUrl")) profile.setWebsiteUrl(asString(body.get("websiteUrl")));
        if (body.containsKey("gender")) profile.setGender(asString(body.get("gender")));
        if (body.containsKey("dateOfBirth")) profile.setDateOfBirth(asDate(body.get("dateOfBirth")));
        CustomerProfile savedProfile = customerProfileRepository.save(profile);
        return buildProfileResponse(savedUser, savedProfile);
    }

    @GetMapping("/users/{id}/profile")
    public User getUserProfile(@PathVariable Long id) {
        return authService.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private Map<String, Object> buildProfileResponse(User user, CustomerProfile profile) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", user.getId());
        payload.put("email", user.getEmail());
        payload.put("displayName", user.getDisplayName());
        payload.put("phone", user.getPhone());
        payload.put("avatarUrl", user.getAvatarUrl());
        payload.put("status", user.getStatus());
        payload.put("roles", user.getRoleNames());
        if (profile != null) {
            payload.put("bio", profile.getBio());
            payload.put("location", profile.getLocation());
            payload.put("websiteUrl", profile.getWebsiteUrl());
            payload.put("gender", profile.getGender());
            payload.put("dateOfBirth", profile.getDateOfBirth());
        }
        return payload;
    }

    private String asString(Object value) {
        return value == null ? null : value.toString();
    }

    private LocalDate asDate(Object value) {
        if (value == null) return null;
        String text = value.toString().trim();
        if (text.isEmpty()) return null;
        return LocalDate.parse(text);
    }
}
