package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Return;
import atom.example.demo.model.User;
import atom.example.demo.repository.ReturnRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/returns")
public class ReturnController {

    private final ReturnRepository returnRepository;
    private final UserRepository userRepository;

    public ReturnController(ReturnRepository returnRepository, UserRepository userRepository) {
        this.returnRepository = returnRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public Return create(@RequestBody Map<String, Object> body, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User customer = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Return returnRequest = new Return();
        returnRequest.setCustomer(customer);
        returnRequest.setReason((String) body.get("reason"));
        return returnRepository.save(returnRequest);
    }

    @GetMapping("/mine")
    public List<Return> getMine(HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return returnRepository.findByCustomerId(userId);
    }

    @GetMapping("/{id}")
    public Return getOne(@PathVariable Long id, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Return returnRequest = returnRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Return not found"));
        if (!returnRequest.getCustomer().getId().equals(userId)) throw new IllegalArgumentException("Not your return");
        return returnRequest;
    }
}
