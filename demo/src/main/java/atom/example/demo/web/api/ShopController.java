package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Shop;
import atom.example.demo.model.ShopStaff;
import atom.example.demo.model.Product;
import atom.example.demo.model.Auction;
import atom.example.demo.service.ShopService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shops")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    @GetMapping("/vendor")
    public ResponseEntity<List<Shop>> getVendorShops() {
        if (!SecurityConfig.hasRole("VENDOR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Long vendorId = SecurityConfig.getSessionUserId();
        if (vendorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(shopService.getVendorShops(vendorId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getShopPublicProfile(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(shopService.getShopPublicProfile(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<Map<String, Object>> getShopPublicProfileBySlug(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(shopService.getShopPublicProfileBySlug(slug));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createShop(@RequestBody Map<String, Object> body) {
        if (!SecurityConfig.hasRole("VENDOR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Vendor access required"));
        }
        Long vendorId = SecurityConfig.getSessionUserId();
        if (vendorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        String name = (String) body.get("name");
        String description = (String) body.get("description");
        String location = (String) body.get("location");
        String policies = (String) body.get("policies");
        String logoUrl = (String) body.get("logoUrl");
        String bannerUrl = (String) body.get("bannerUrl");
        
        Long primaryCategoryId = null;
        if (body.get("primaryCategoryId") != null) {
            primaryCategoryId = Long.valueOf(body.get("primaryCategoryId").toString());
        }

        try {
            Shop shop = shopService.createShop(vendorId, name, description, location, policies, primaryCategoryId, logoUrl, bannerUrl);
            return ResponseEntity.status(HttpStatus.CREATED).body(shop);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateShop(@PathVariable Long id, @RequestBody Map<String, String> updates) {
        if (!SecurityConfig.hasRole("VENDOR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Vendor access required"));
        }
        Long vendorId = SecurityConfig.getSessionUserId();
        if (vendorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            Shop shop = shopService.updateShop(id, vendorId, updates);
            return ResponseEntity.ok(shop);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/toggle-follow")
    public ResponseEntity<?> toggleFollow(@PathVariable Long id) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }
        try {
            return ResponseEntity.ok(shopService.toggleFollow(id, userId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Staff management
    @GetMapping("/{id}/staff")
    public ResponseEntity<?> getShopStaff(@PathVariable Long id) {
        if (!SecurityConfig.hasRole("VENDOR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Vendor access required"));
        }
        Long vendorId = SecurityConfig.getSessionUserId();
        if (vendorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            Shop shop = shopService.getShopById(id);
            if (!shop.getVendor().getId().equals(vendorId)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Not your shop"));
            }
            return ResponseEntity.ok(shopService.getShopStaff(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/staff")
    public ResponseEntity<?> addStaff(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (!SecurityConfig.hasRole("VENDOR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Vendor access required"));
        }
        Long vendorId = SecurityConfig.getSessionUserId();
        if (vendorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        Long staffUserId = Long.valueOf(body.get("userId").toString());
        String role = (String) body.get("role");

        try {
            ShopStaff staff = shopService.addStaff(id, vendorId, staffUserId, role);
            return ResponseEntity.status(HttpStatus.CREATED).body(staff);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/staff/{staffId}")
    public ResponseEntity<?> removeStaff(@PathVariable Long id, @PathVariable Long staffId) {
        if (!SecurityConfig.hasRole("VENDOR")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Vendor access required"));
        }
        Long vendorId = SecurityConfig.getSessionUserId();
        if (vendorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Not authenticated"));
        }

        try {
            shopService.removeStaff(id, vendorId, staffId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/products")
    public ResponseEntity<List<Product>> getShopProducts(@PathVariable Long id) {
        try {
            List<Product> products = shopService.getShopProducts(id);
            return ResponseEntity.ok(products);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{id}/auctions")
    public ResponseEntity<List<Auction>> getShopAuctions(@PathVariable Long id) {
        try {
            List<Auction> auctions = shopService.getShopAuctions(id);
            return ResponseEntity.ok(auctions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
