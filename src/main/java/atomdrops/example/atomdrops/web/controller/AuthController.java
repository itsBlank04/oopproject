package atomdrops.example.atomdrops.web.controller;

import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.service.AuthService;
import atomdrops.example.atomdrops.web.dto.LoginRequest;
import atomdrops.example.atomdrops.web.dto.RegisterRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping
public class AuthController {
    public static final String SESSION_USER_ID = "userId";
    public static final String SESSION_ROLE = "role";

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/register")
    public String registerForm(Model model) {
        model.addAttribute("registerRequest", new RegisterRequest());
        return "register";
    }

    @PostMapping("/register")
    public String register(
            @Valid RegisterRequest registerRequest,
            BindingResult bindingResult,
            RedirectAttributes redirectAttributes,
            Model model
    ) {
        if ("admin".equalsIgnoreCase(registerRequest.getRole())) {
            String email = registerRequest.getEmail() == null ? "" : registerRequest.getEmail().trim();
            String name = registerRequest.getDisplayName() == null ? "" : registerRequest.getDisplayName().trim();
            String phone = registerRequest.getPhone() == null ? "" : registerRequest.getPhone().trim();
            return "redirect:/admin/setup?email=" + email + "&displayName=" + name + "&phone=" + phone;
        }
        if (bindingResult.hasErrors()) {
            return "register";
        }

        if ("admin".equalsIgnoreCase(registerRequest.getRole())) {
            redirectAttributes.addFlashAttribute("registerRequest", registerRequest);
            redirectAttributes.addAttribute("role", "admin");
            return "redirect:/admin/setup";
        }

        try {
            authService.register(registerRequest);
        } catch (IllegalArgumentException ex) {
            model.addAttribute("error", ex.getMessage());
            return "register";
        }

        return "redirect:/login?registered=1";
    }

    @PostMapping("/login")
    public String login(
            @Valid LoginRequest loginRequest,
            BindingResult bindingResult,
            HttpSession session,
            Model model
    ) {
        if (bindingResult.hasErrors()) {
            return "login";
        }

        LoginRequest trimmed = new LoginRequest();
        trimmed.setEmail(loginRequest.getEmail().trim());
        trimmed.setPassword(loginRequest.getPassword());

        Optional<User> userOpt = authService.authenticate(trimmed);
        if (userOpt.isEmpty()) {
            model.addAttribute("error", "Invalid email or password");
            return "login";
        }

        User user = userOpt.get();
        session.setAttribute(SESSION_USER_ID, user.getId());
        session.setAttribute(SESSION_ROLE, authService.resolveUserRole(user.getId()));

        return "redirect:/dashboard";
    }

    @GetMapping("/login")
    public String loginForm(Model model, @RequestParam(name = "registered", required = false) String registered) {
        model.addAttribute("loginRequest", new LoginRequest());
        if (registered != null) {
            model.addAttribute("registered", true);
        }
        return "login";
    }

    @GetMapping("/dashboard")
    public String dashboard(HttpSession session, Model model) {
        Object roleObj = session.getAttribute(SESSION_ROLE);
        if (roleObj == null) {
            return "redirect:/login";
        }
        String role = roleObj.toString();
        model.addAttribute("role", role);
        if ("VENDOR".equalsIgnoreCase(role)) {
            return "dashboards/vendor";
        }
        if ("TECHNICIAN".equalsIgnoreCase(role)) {
            return "dashboards/technician";
        }
        if ("ADMIN".equalsIgnoreCase(role)) {
            return "dashboards/admin";
        }
        return "dashboards/customer";
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/";
    }

    @GetMapping("/admin/setup")
    public String adminSetupForm(
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "displayName", required = false) String displayName,
            @RequestParam(name = "phone", required = false) String phone,
            Model model
    ) {
        RegisterRequest request = new RegisterRequest();
        if (email != null) {
            request.setEmail(email);
        }
        if (displayName != null) {
            request.setDisplayName(displayName);
        }
        if (phone != null) {
            request.setPhone(phone);
        }
        model.addAttribute("registerRequest", request);
        return "admin-setup";
    }

    @PostMapping("/admin/setup")
    public String createAdmin(
            @Valid RegisterRequest registerRequest,
            BindingResult bindingResult,
            Model model
    ) {
        if (bindingResult.hasErrors()) {
            return "admin-setup";
        }
        try {
            authService.registerAsAdmin(registerRequest);
        } catch (IllegalArgumentException ex) {
            model.addAttribute("error", ex.getMessage());
            return "admin-setup";
        }
        return "redirect:/login?registered=1";
    }
}
