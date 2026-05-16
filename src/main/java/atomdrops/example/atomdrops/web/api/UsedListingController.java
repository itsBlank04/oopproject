package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.service.UsedListingService;
import atomdrops.example.atomdrops.web.dto.UsedListingRequest;
import atomdrops.example.atomdrops.web.dto.UsedListingResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/used-listings")
public class UsedListingController {

    private final UsedListingService usedListingService;

    public UsedListingController(UsedListingService usedListingService) {
        this.usedListingService = usedListingService;
    }

    @GetMapping
    public ResponseEntity<List<UsedListingResponse>> getAll(@RequestParam(required = false) Long categoryId) {
        return ResponseEntity.ok(usedListingService.findAll(Optional.ofNullable(categoryId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsedListingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(usedListingService.findById(id));
    }

    @PostMapping
    public ResponseEntity<UsedListingResponse> create(@Valid @RequestBody UsedListingRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UsedListingResponse response = usedListingService.create(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsedListingResponse> update(@PathVariable Long id, @Valid @RequestBody UsedListingRequest request, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            return ResponseEntity.ok(usedListingService.update(id, userId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            usedListingService.delete(id, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
