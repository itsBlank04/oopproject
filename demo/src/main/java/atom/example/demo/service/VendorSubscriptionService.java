package atom.example.demo.service;

import atom.example.demo.model.*;
import atom.example.demo.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class VendorSubscriptionService {

    private final VendorSubscriptionRepository vendorSubscriptionRepository;
    private final VendorSubscriptionPlanRepository vendorSubscriptionPlanRepository;
    private final VendorSubscriptionDealRepository vendorSubscriptionDealRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    public VendorSubscriptionService(VendorSubscriptionRepository vendorSubscriptionRepository,
                                     VendorSubscriptionPlanRepository vendorSubscriptionPlanRepository,
                                     VendorSubscriptionDealRepository vendorSubscriptionDealRepository,
                                     ShopRepository shopRepository,
                                     UserRepository userRepository) {
        this.vendorSubscriptionRepository = vendorSubscriptionRepository;
        this.vendorSubscriptionPlanRepository = vendorSubscriptionPlanRepository;
        this.vendorSubscriptionDealRepository = vendorSubscriptionDealRepository;
        this.shopRepository = shopRepository;
        this.userRepository = userRepository;
    }

    public List<VendorSubscriptionPlan> getAllPlans() {
        return vendorSubscriptionPlanRepository.findAll();
    }

    public Optional<VendorSubscription> getVendorSubscription(Long vendorId) {
        return vendorSubscriptionRepository.findByVendorId(vendorId);
    }

    /**
     * Auto-enroll a vendor on the free Basic plan when they first become a vendor.
     */
    @Transactional
    public VendorSubscription ensureBasicSubscription(Long vendorId) {
        Optional<VendorSubscription> existing = vendorSubscriptionRepository.findByVendorId(vendorId);
        if (existing.isPresent()) {
            return existing.get();
        }

        User vendor = userRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        VendorSubscriptionPlan basicPlan = vendorSubscriptionPlanRepository.findByName("BASIC")
            .orElseThrow(() -> new IllegalStateException("BASIC plan not found. Please seed subscription plans."));

        VendorSubscription sub = new VendorSubscription();
        sub.setVendor(vendor);
        sub.setPlan(basicPlan);
        sub.setBillingCycle("FREE");
        sub.setStatus("ACTIVE");
        sub.setStartsAt(Instant.now());
        // Basic plan never expires
        sub.setExpiresAt(null);
        return vendorSubscriptionRepository.save(sub);
    }

    /**
     * Subscribe or upgrade to a new plan. In a real system, this would be called after payment verification.
     */
    @Transactional
    public VendorSubscription subscribeToPlan(Long vendorId, Long planId, String billingCycle) {
        User vendor = userRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        VendorSubscriptionPlan plan = vendorSubscriptionPlanRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found"));

        if (!List.of("MONTHLY", "YEARLY", "FREE").contains(billingCycle)) {
            throw new IllegalArgumentException("Invalid billing cycle");
        }

        // Determine expiry
        Instant now = Instant.now();
        Instant expiresAt = null;
        if ("MONTHLY".equals(billingCycle)) {
            expiresAt = now.plus(30, ChronoUnit.DAYS);
        } else if ("YEARLY".equals(billingCycle)) {
            expiresAt = now.plus(365, ChronoUnit.DAYS);
        }
        // FREE never expires

        Optional<VendorSubscription> existing = vendorSubscriptionRepository.findByVendorId(vendorId);
        VendorSubscription sub;
        if (existing.isPresent()) {
            sub = existing.get();
            sub.setPlan(plan);
            sub.setBillingCycle(billingCycle);
            sub.setStatus("ACTIVE");
            sub.setStartsAt(now);
            sub.setExpiresAt(expiresAt);
            sub.setGracePeriodEnds(null);
        } else {
            sub = new VendorSubscription();
            sub.setVendor(vendor);
            sub.setPlan(plan);
            sub.setBillingCycle(billingCycle);
            sub.setStatus("ACTIVE");
            sub.setStartsAt(now);
            sub.setExpiresAt(expiresAt);
        }

        return vendorSubscriptionRepository.save(sub);
    }

    /**
     * Downgrade handling: if the vendor's shop count exceeds the new plan's limit,
     * pause extra shops.
     */
    @Transactional
    public void enforceShopLimits(Long vendorId) {
        VendorSubscription sub = vendorSubscriptionRepository.findByVendorId(vendorId).orElse(null);
        if (sub == null) return;

        int maxShops = sub.getPlan().getMaxShops();
        if (maxShops == -1) return; // Unlimited

        List<Shop> shops = shopRepository.findByVendorId(vendorId);
        // Sort by creation: keep oldest ones active
        shops.sort(Comparator.comparing(Shop::getCreatedAt));

        int activeCount = 0;
        for (Shop shop : shops) {
            if ("ARCHIVED".equals(shop.getStatus())) continue;
            activeCount++;
            if (activeCount > maxShops && "ACTIVE".equals(shop.getStatus())) {
                shop.setStatus("PAUSED");
                shopRepository.save(shop);
            }
        }
    }

    public List<VendorSubscriptionDeal> getActiveDeals() {
        return vendorSubscriptionDealRepository.findByIsActiveTrueAndEndsAtAfter(Instant.now());
    }

    public Map<String, Object> getSubscriptionSummary(Long vendorId) {
        Map<String, Object> result = new LinkedHashMap<>();
        VendorSubscription sub = vendorSubscriptionRepository.findByVendorId(vendorId).orElse(null);
        long shopCount = shopRepository.countByVendorId(vendorId);

        if (sub != null) {
            result.put("subscriptionId", sub.getId());
            result.put("planName", sub.getPlan().getName());
            result.put("planDisplayName", sub.getPlan().getDisplayName());
            result.put("maxShops", sub.getPlan().getMaxShops());
            result.put("billingCycle", sub.getBillingCycle());
            result.put("status", sub.getStatus());
            result.put("startsAt", sub.getStartsAt());
            result.put("expiresAt", sub.getExpiresAt());
            result.put("gracePeriodEnds", sub.getGracePeriodEnds());
        } else {
            result.put("subscriptionId", null);
            result.put("planName", "NONE");
            result.put("planDisplayName", "No Subscription");
            result.put("maxShops", 0);
            result.put("billingCycle", "NONE");
            result.put("status", "NONE");
            result.put("startsAt", null);
            result.put("expiresAt", null);
            result.put("gracePeriodEnds", null);
        }
        result.put("currentShopCount", shopCount);
        return result;
    }
}
