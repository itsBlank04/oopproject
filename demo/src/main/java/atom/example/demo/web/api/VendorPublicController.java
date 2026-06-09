package atom.example.demo.web.api;

import atom.example.demo.model.Product;
import atom.example.demo.model.User;
import atom.example.demo.model.VendorProfile;
import atom.example.demo.repository.ReviewRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorProfileRepository;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.ShopFollowerRepository;
import atom.example.demo.repository.ShopRepository;
import atom.example.demo.model.Shop;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vendors")
public class VendorPublicController {

    private final VendorProfileRepository vendorProfileRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final ShopFollowerRepository shopFollowerRepository;

    public VendorPublicController(VendorProfileRepository vendorProfileRepository,
            UserRepository userRepository, ReviewRepository reviewRepository,
            ProductRepository productRepository,
            ShopRepository shopRepository,
            ShopFollowerRepository shopFollowerRepository) {
        this.vendorProfileRepository = vendorProfileRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.shopRepository = shopRepository;
        this.shopFollowerRepository = shopFollowerRepository;
    }

    @GetMapping("/{vendorId}/profile")
    public Map<String, Object> getVendorProfile(@PathVariable Long vendorId) {
        User user = userRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));
        VendorProfile profile = vendorProfileRepository.findByUserId(vendorId).orElse(null);
        long productCount = productRepository.countByVendorId(vendorId);
        var reviews = reviewRepository.findByRevieweeId(vendorId);
        double avgRating = reviews.stream().mapToInt(r -> r.getRating()).average().orElse(0.0);

        // Get first shop for follower count
        List<Shop> shops = shopRepository.findByVendorId(vendorId);
        long followerCount = 0;
        Long shopId = null;
        if (!shops.isEmpty()) {
            Shop firstShop = shops.get(0);
            shopId = firstShop.getId();
            followerCount = shopFollowerRepository.countByShopId(shopId);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("shopId", shopId);
        result.put("displayName", user.getDisplayName());
        result.put("email", user.getEmail());
        result.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");
        result.put("shopName", profile != null ? profile.getShopName() : "");
        result.put("shopSlug", profile != null ? profile.getShopSlug() : "");
        result.put("logoUrl", profile != null && profile.getLogoUrl() != null ? profile.getLogoUrl() : "");
        result.put("bio", profile != null && profile.getBio() != null ? profile.getBio() : "");
        result.put("location", profile != null && profile.getLocation() != null ? profile.getLocation() : "");
        result.put("verificationStatus", profile != null ? profile.getVerificationStatus() : "VERIFIED");
        result.put("productCount", productCount);
        result.put("reviewCount", reviews.size());
        result.put("avgRating", Math.round(avgRating * 10.0) / 10.0);
        result.put("followerCount", followerCount);
        return result;
    }

    @GetMapping("/slug/{shopSlug}")
    public Map<String, Object> getVendorBySlug(@PathVariable String shopSlug) {
        VendorProfile profile = vendorProfileRepository.findByShopSlug(shopSlug)
            .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        return getVendorProfile(profile.getUser().getId());
    }

    @GetMapping("/{vendorId}/products")
    public List<Product> getVendorProducts(@PathVariable Long vendorId) {
        return productRepository.findByVendorId(vendorId).stream()
            .filter(p -> "ACTIVE".equals(p.getStatus()))
            .toList();
    }
}
