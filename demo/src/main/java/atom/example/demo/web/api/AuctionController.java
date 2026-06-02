package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Auction;
import atom.example.demo.service.AuctionRealtimeService;
import atom.example.demo.service.AuctionService;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/auctions")
public class AuctionController {

    private static final Set<String> VALID_TYPES = Set.of("STANDARD", "FLASH", "REVERSE", "RESERVE");

    private final AuctionService auctionService;
    private final AuctionRealtimeService auctionRealtimeService;

    public AuctionController(AuctionService auctionService, AuctionRealtimeService auctionRealtimeService) {
        this.auctionService = auctionService;
        this.auctionRealtimeService = auctionRealtimeService;
    }

    @GetMapping
    public List<Auction> list(@RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {
        if (status != null) status = status.toUpperCase();
        if (type != null) type = type.toUpperCase();
        return auctionService.listAuctions(status, type);
    }

    @GetMapping("/{id}")
    public Auction getOne(@PathVariable Long id) {
        return auctionService.getAuction(id);
    }

    @GetMapping("/{id}/events")
    public SseEmitter events(@PathVariable Long id) {
        return auctionRealtimeService.subscribe(id);
    }

    @PostMapping
    public Auction create(@RequestBody Map<String, Object> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        String title = (String) body.get("title");
        String type = (String) body.get("type");
        if (type != null) type = type.toUpperCase();
        Integer preparationDurationMinutes = parseInteger(body.get("preparationDurationMinutes"));
        Integer activeDurationMinutes = parseInteger(body.get("activeDurationMinutes"));
        boolean termsAccepted = body.containsKey("termsAccepted") && Boolean.parseBoolean(body.get("termsAccepted").toString());
        if (title == null || type == null || preparationDurationMinutes == null || activeDurationMinutes == null)
            throw new IllegalArgumentException("title, type, preparationDurationMinutes, and activeDurationMinutes are required");
        if (!VALID_TYPES.contains(type))
            throw new IllegalArgumentException("Invalid auction type. Use STANDARD, FLASH, REVERSE, or RESERVE");
        return auctionService.createAuction(userId, title, type, preparationDurationMinutes, activeDurationMinutes, termsAccepted);
    }

    @PutMapping("/{id}")
    public Auction update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        String title = (String) body.get("title");
        String type = (String) body.get("type");
        if (type != null) {
            type = type.toUpperCase();
            if (!VALID_TYPES.contains(type))
                throw new IllegalArgumentException("Invalid auction type. Use STANDARD, FLASH, REVERSE, or RESERVE");
        }
        Integer preparationDurationMinutes = body.containsKey("preparationDurationMinutes")
                ? parseInteger(body.get("preparationDurationMinutes")) : null;
        Integer activeDurationMinutes = body.containsKey("activeDurationMinutes")
                ? parseInteger(body.get("activeDurationMinutes")) : null;
        Boolean termsAccepted = body.containsKey("termsAccepted") ? Boolean.parseBoolean(body.get("termsAccepted").toString()) : null;
        return auctionService.updateAuction(id, userId, title, type, preparationDurationMinutes, activeDurationMinutes, termsAccepted);
    }

    @PostMapping("/{id}/publish")
    public Auction publish(@PathVariable Long id) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        return auctionService.publishAuction(id, userId);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        auctionService.deleteAuction(id, userId);
        return Map.of("message", "Deleted");
    }

    private Integer parseInteger(Object value) {
        return value == null ? null : Integer.parseInt(value.toString());
    }
}
