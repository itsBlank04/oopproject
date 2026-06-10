package atom.example.demo.service;

import atom.example.demo.model.*;
import atom.example.demo.repository.*;
import atom.example.demo.config.SecurityConfig;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ShopService {

    private final ShopRepository shopRepository;
    private final ShopFollowerRepository shopFollowerRepository;
    private final ShopStaffRepository shopStaffRepository;
    private final VendorSubscriptionRepository vendorSubscriptionRepository;
    private final VendorSubscriptionPlanRepository vendorSubscriptionPlanRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;
    private final AuctionRepository auctionRepository;

    public ShopService(ShopRepository shopRepository,
                       ShopFollowerRepository shopFollowerRepository,
                       ShopStaffRepository shopStaffRepository,
                       VendorSubscriptionRepository vendorSubscriptionRepository,
                       VendorSubscriptionPlanRepository vendorSubscriptionPlanRepository,
                       UserRepository userRepository,
                       ProductRepository productRepository,
                       ReviewRepository reviewRepository,
                       AuctionRepository auctionRepository) {
        this.shopRepository = shopRepository;
        this.shopFollowerRepository = shopFollowerRepository;
        this.shopStaffRepository = shopStaffRepository;
        this.vendorSubscriptionRepository = vendorSubscriptionRepository;
        this.vendorSubscriptionPlanRepository = vendorSubscriptionPlanRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.reviewRepository = reviewRepository;
        this.auctionRepository = auctionRepository;
    }

    @Transactional
    public Shop ensureDefaultShop(Long vendorId) {
        User vendor = userRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        List<Shop> shops = shopRepository.findByVendorId(vendorId);
        if (!shops.isEmpty()) {
            return shops.get(0);
        }

        // Create a default shop
        Shop shop = new Shop();
        shop.setVendor(vendor);
        shop.setName(vendor.getDisplayName() + "'s Shop");
        shop.setSlug(generateSlug(vendor.getDisplayName() + "-shop"));
        shop.setDescription("Welcome to our shop!");
        shop.setLocation("Dhaka, Bangladesh");
        shop.setStatus("ACTIVE");
        shop.setVerificationLevel("STANDARD");
        
        Shop saved = shopRepository.save(shop);

        // Add owner as staff
        ShopStaff ownerStaff = new ShopStaff();
        ownerStaff.setShop(saved);
        ownerStaff.setUser(vendor);
        ownerStaff.setRole("OWNER");
        shopStaffRepository.save(ownerStaff);

        // Associate existing products and auctions with this default shop
        List<Product> products = productRepository.findByVendorId(vendorId);
        for (Product p : products) {
            if (p.getShop() == null) {
                p.setShop(saved);
                productRepository.save(p);
            }
        }

        List<Auction> auctions = auctionRepository.findByVendorId(vendorId);
        for (Auction a : auctions) {
            if (a.getShop() == null) {
                a.setShop(saved);
                auctionRepository.save(a);
            }
        }

        return saved;
    }

    public List<Shop> getVendorShops(Long vendorId) {
        ensureDefaultShop(vendorId);
        return shopRepository.findByVendorId(vendorId);
    }

    public Shop getShopById(Long shopId) {
        return shopRepository.findById(shopId)
            .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
    }

    public Shop getShopBySlug(String slug) {
        return shopRepository.findBySlug(slug)
            .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
    }

    @Transactional
    public Shop createShop(Long vendorId, String name, String description, String location,
                           String policies, Long primaryCategoryId,
                           String logoUrl, String bannerUrl) {
        User vendor = userRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check vendor role
        boolean isVendor = vendor.getRoles().stream()
            .anyMatch(r -> "VENDOR".equals(r.getName()));
        if (!isVendor) {
            throw new IllegalArgumentException("User is not a vendor");
        }

        // Check shop limit based on subscription
        long currentShopCount = shopRepository.countByVendorId(vendorId);
        int maxShops = getMaxShopsForVendor(vendorId);
        if (maxShops != -1 && currentShopCount >= maxShops) {
            throw new IllegalArgumentException(
                "Shop limit reached. Upgrade your subscription to create more shops. " +
                "Current: " + currentShopCount + ", Max: " + maxShops);
        }

        // Validate unique shop name
        if (shopRepository.findByName(name).isPresent()) {
            throw new IllegalArgumentException("A shop with this name already exists");
        }

        // Generate slug
        String slug = generateSlug(name);

        Shop shop = new Shop();
        shop.setVendor(vendor);
        shop.setName(name);
        shop.setSlug(slug);
        shop.setDescription(description);
        shop.setLocation(location);
        shop.setPolicies(policies);
        shop.setLogoUrl(logoUrl);
        shop.setBannerUrl(bannerUrl);

        Shop saved = shopRepository.save(shop);

        // Add owner as staff
        ShopStaff ownerStaff = new ShopStaff();
        ownerStaff.setShop(saved);
        ownerStaff.setUser(vendor);
        ownerStaff.setRole("OWNER");
        shopStaffRepository.save(ownerStaff);

        return saved;
    }

    @Transactional
    public Shop updateShop(Long shopId, Long vendorId, Map<String, String> updates) {
        Shop shop = shopRepository.findById(shopId)
            .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        if (!shop.getVendor().getId().equals(vendorId)) {
            throw new SecurityException("Not your shop");
        }

        if (updates.containsKey("name")) {
            String newName = updates.get("name");
            Optional<Shop> existing = shopRepository.findByName(newName);
            if (existing.isPresent() && !existing.get().getId().equals(shopId)) {
                throw new IllegalArgumentException("A shop with this name already exists");
            }
            shop.setName(newName);
            shop.setSlug(generateSlug(newName));
        }
        if (updates.containsKey("description")) shop.setDescription(updates.get("description"));
        if (updates.containsKey("location")) shop.setLocation(updates.get("location"));
        if (updates.containsKey("policies")) shop.setPolicies(updates.get("policies"));
        if (updates.containsKey("logoUrl")) shop.setLogoUrl(updates.get("logoUrl"));
        if (updates.containsKey("bannerUrl")) shop.setBannerUrl(updates.get("bannerUrl"));
        if (updates.containsKey("status")) {
            String status = updates.get("status");
            if (!List.of("ACTIVE", "PAUSED", "ARCHIVED").contains(status)) {
                throw new IllegalArgumentException("Invalid status");
            }
            shop.setStatus(status);
        }

        return shopRepository.save(shop);
    }

    @Transactional
    public Map<String, Object> toggleFollow(Long shopId, Long userId) {
        Shop shop = shopRepository.findById(shopId)
            .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        if (shop.getVendor().getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot follow your own shop");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Optional<ShopFollower> existing = shopFollowerRepository.findByShopIdAndUserId(shopId, userId);
        boolean isFollowing;
        if (existing.isPresent()) {
            shopFollowerRepository.delete(existing.get());
            isFollowing = false;
        } else {
            ShopFollower follower = new ShopFollower();
            follower.setShop(shop);
            follower.setUser(user);
            shopFollowerRepository.save(follower);
            isFollowing = true;
        }

        long followerCount = shopFollowerRepository.countByShopId(shopId);
        return Map.of("following", isFollowing, "followerCount", followerCount);
    }

    public Map<String, Object> getShopPublicProfile(Long shopId) {
        Shop shop = shopRepository.findById(shopId)
            .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        return buildShopPublicData(shop);
    }

    public Map<String, Object> getShopPublicProfileBySlug(String slug) {
        Shop shop = shopRepository.findBySlug(slug)
            .orElseGet(() -> shopRepository.findBySlugIgnoreCase(slug).orElse(null));
        if (shop == null) {
            try {
                Long id = Long.valueOf(slug);
                shop = shopRepository.findById(id).orElse(null);
            } catch (NumberFormatException ignored) {}
        }
        if (shop == null) {
            throw new IllegalArgumentException("Shop not found");
        }
        return buildShopPublicData(shop);
    }

    private Map<String, Object> buildShopPublicData(Shop shop) {
        long followerCount = shopFollowerRepository.countByShopId(shop.getId());
        long productCount = productRepository.findByVendorId(shop.getVendor().getId()).stream()
            .filter(p -> p.getShop() != null && p.getShop().getId().equals(shop.getId()))
            .filter(p -> "ACTIVE".equals(p.getStatus()))
            .count();
        var reviews = reviewRepository.findByRevieweeId(shop.getVendor().getId());
        double avgRating = reviews.stream().mapToInt(r -> r.getRating()).average().orElse(0.0);

        Long loggedInUserId = SecurityConfig.getSessionUserId();
        boolean following = false;
        if (loggedInUserId != null) {
            following = shopFollowerRepository.findByShopIdAndUserId(shop.getId(), loggedInUserId).isPresent();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", shop.getId());
        result.put("vendorId", shop.getVendor().getId());
        result.put("vendorDisplayName", shop.getVendor().getDisplayName());
        result.put("name", shop.getName());
        result.put("slug", shop.getSlug());
        result.put("logoUrl", shop.getLogoUrl() != null ? shop.getLogoUrl() : "");
        result.put("bannerUrl", shop.getBannerUrl() != null ? shop.getBannerUrl() : "");
        result.put("description", shop.getDescription() != null ? shop.getDescription() : "");
        result.put("location", shop.getLocation() != null ? shop.getLocation() : "");
        result.put("policies", shop.getPolicies() != null ? shop.getPolicies() : "");
        result.put("status", shop.getStatus());
        result.put("verificationLevel", shop.getVerificationLevel());
        result.put("followerCount", followerCount);
        result.put("following", following);
        result.put("productCount", productCount);
        result.put("reviewCount", reviews.size());
        result.put("avgRating", Math.round(avgRating * 10.0) / 10.0);
        result.put("createdAt", shop.getCreatedAt());
        return result;
    }

    // Staff management
    @Transactional
    public ShopStaff addStaff(Long shopId, Long vendorId, Long staffUserId, String role) {
        Shop shop = shopRepository.findById(shopId)
            .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        if (!shop.getVendor().getId().equals(vendorId)) {
            throw new SecurityException("Only the shop owner can manage staff");
        }
        if (!List.of("MANAGER", "INVENTORY", "SUPPORT").contains(role)) {
            throw new IllegalArgumentException("Invalid staff role: " + role);
        }
        User staffUser = userRepository.findById(staffUserId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (shopStaffRepository.existsByShopIdAndUserId(shopId, staffUserId)) {
            throw new IllegalArgumentException("User is already staff of this shop");
        }

        ShopStaff staff = new ShopStaff();
        staff.setShop(shop);
        staff.setUser(staffUser);
        staff.setRole(role);
        return shopStaffRepository.save(staff);
    }

    @Transactional
    public void removeStaff(Long shopId, Long vendorId, Long staffId) {
        Shop shop = shopRepository.findById(shopId)
            .orElseThrow(() -> new IllegalArgumentException("Shop not found"));
        if (!shop.getVendor().getId().equals(vendorId)) {
            throw new SecurityException("Only the shop owner can manage staff");
        }
        ShopStaff staff = shopStaffRepository.findById(staffId)
            .orElseThrow(() -> new IllegalArgumentException("Staff not found"));
        if ("OWNER".equals(staff.getRole())) {
            throw new IllegalArgumentException("Cannot remove the shop owner");
        }
        shopStaffRepository.delete(staff);
    }

    public List<ShopStaff> getShopStaff(Long shopId) {
        return shopStaffRepository.findByShopId(shopId);
    }

    public List<Product> getShopProducts(Long shopId) {
        return productRepository.findByShopId(shopId).stream()
            .filter(p -> p.getDeletedAt() == null && "ACTIVE".equals(p.getStatus()))
            .toList();
    }

    public List<Auction> getShopAuctions(Long shopId) {
        return auctionRepository.findByShopId(shopId).stream()
            .filter(a -> List.of("PREPARING", "ACTIVE").contains(a.getStatus()))
            .toList();
    }

    private int getMaxShopsForVendor(Long vendorId) {
        return vendorSubscriptionRepository.findByVendorId(vendorId)
            .map(sub -> sub.getPlan().getMaxShops())
            .orElse(1); // Default to 1 (basic plan) if no subscription found
    }

    private String generateSlug(String name) {
        String base = name.toLowerCase()
            .replaceAll("[^a-z0-9\\s-]", "")
            .replaceAll("\\s+", "-")
            .replaceAll("-+", "-")
            .replaceAll("^-|-$", "");
        // Add uniqueness suffix
        String slug = base;
        int suffix = 1;
        while (shopRepository.findBySlug(slug).isPresent()) {
            slug = base + "-" + suffix;
            suffix++;
        }
        return slug;
    }
}
