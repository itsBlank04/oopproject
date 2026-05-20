package atom.example.demo.web.api;

import atom.example.demo.model.User;
import atom.example.demo.model.VendorProfile;
import atom.example.demo.repository.ReviewRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorProfileRepository;
import atom.example.demo.repository.ProductRepository;
import java.util.HashMap;
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

    public VendorPublicController(VendorProfileRepository vendorProfileRepository,
            UserRepository userRepository, ReviewRepository reviewRepository,
            ProductRepository productRepository) {
        this.vendorProfileRepository = vendorProfileRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/{vendorId}/profile")
    public Map<String, Object> getVendorProfile(@PathVariable Long vendorId) {
        User user = userRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));
        VendorProfile profile = vendorProfileRepository.findByUserId(vendorId).orElse(null);
        long productCount = productRepository.countByVendorId(vendorId);
        var reviews = reviewRepository.findByRevieweeId(vendorId);
        double avgRating = reviews.stream().mapToInt(r -> r.getRating()).average().orElse(0.0);
        Map<String, Object> result = new HashMap<>();
        result.put("id", user.getId());
        result.put("displayName", user.getDisplayName());
        result.put("email", user.getEmail());
        result.put("avatarUrl", user.getAvatarUrl() != null ? user.getAvatarUrl() : "");
        result.put("shopName", profile != null ? profile.getShopName() : "");
        result.put("shopSlug", profile != null ? profile.getShopSlug() : "");
        result.put("logoUrl", profile != null && profile.getLogoUrl() != null ? profile.getLogoUrl() : "");
        result.put("bio", profile != null && profile.getBio() != null ? profile.getBio() : "");
        result.put("location", profile != null && profile.getLocation() != null ? profile.getLocation() : "");
        result.put("verificationStatus", profile != null ? profile.getVerificationStatus() : "PENDING");
        result.put("productCount", productCount);
        result.put("reviewCount", reviews.size());
        result.put("avgRating", Math.round(avgRating * 10.0) / 10.0);
        return result;
    }
}
