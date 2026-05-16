package atomdrops.example.atomdrops.config;

import atomdrops.example.atomdrops.model.*;
import atomdrops.example.atomdrops.model.enums.*;
import atomdrops.example.atomdrops.repository.*;
import atomdrops.example.atomdrops.service.OrderService;
import atomdrops.example.atomdrops.service.PasswordService;
import atomdrops.example.atomdrops.service.TrustScoreService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedDemoData(
        CategoryRepository categoryRepository,
        ConditionLevelRepository conditionLevelRepository,
        RoleRepository roleRepository,
        UserRepository userRepository,
        UserRoleRepository userRoleRepository,
        PasswordService passwordService,
        ProductRepository productRepository,
        ProductImageRepository productImageRepository,
        InventoryRepository inventoryRepository,
        UsedListingRepository usedListingRepository,
        UsedImageRepository usedImageRepository,
        UsedVideoRepository usedVideoRepository,
        UsedItemHistoryRepository usedItemHistoryRepository,
        TechnicianRepository technicianRepository,
        ServiceListingRepository serviceListingRepository,
        AuctionRepository auctionRepository,
        AuctionLotRepository auctionLotRepository,
        AuctionImageRepository auctionImageRepository,
        BidRepository bidRepository,
        OrderService orderService,
        TrustScoreService trustScoreService,
        TrustScoreRepository trustScoreRepository,
        TrustEventRepository trustEventRepository,
        FraudFlagRepository fraudFlagRepository
    ) {
        return args -> {
            seedCategories(categoryRepository);
            seedConditionLevels(conditionLevelRepository);

            User vendor = ensureUser(
                "vendor@atomdrops.local",
                "Vendor Studio",
                "01700000001",
                UserStatus.ACTIVE,
                AuthRoles.VENDOR,
                roleRepository,
                userRepository,
                userRoleRepository,
                passwordService
            );
            User customer = ensureUser(
                "customer@atomdrops.local",
                "Citrine Buyer",
                "01700000002",
                UserStatus.ACTIVE,
                AuthRoles.CUSTOMER,
                roleRepository,
                userRepository,
                userRoleRepository,
                passwordService
            );
            User technicianUser = ensureUser(
                "tech@atomdrops.local",
                "Repair Lab",
                "01700000003",
                UserStatus.ACTIVE,
                AuthRoles.TECHNICIAN,
                roleRepository,
                userRepository,
                userRoleRepository,
                passwordService
            );
            User admin = ensureUser(
                "admin@atomdrops.local",
                "Platform Admin",
                "01700000004",
                UserStatus.ACTIVE,
                AuthRoles.ADMIN,
                roleRepository,
                userRepository,
                userRoleRepository,
                passwordService
            );

            seedTrustScores(userRepository, trustScoreService, trustScoreRepository, trustEventRepository, vendor, customer, technicianUser, admin);
            seedFraudFlags(fraudFlagRepository, customer);

            if (productRepository.count() == 0) {
                seedProducts(vendor, categoryRepository, productRepository, productImageRepository, inventoryRepository);
            }

        if (usedListingRepository.count() == 0) {
            seedUsedListings(customer, categoryRepository, conditionLevelRepository,
                usedListingRepository, usedImageRepository, usedVideoRepository, usedItemHistoryRepository);
        }

            if (technicianRepository.count() == 0) {
                seedTechnicians(technicianUser, technicianRepository, serviceListingRepository);
            }

            if (auctionRepository.count() == 0) {
                seedAuctions(vendor, customer, auctionRepository, auctionLotRepository, auctionImageRepository, bidRepository);
            }

            if (orderService != null) {
                seedDemoOrder(customer, productRepository, orderService);
            }
        };
    }

    private void seedCategories(CategoryRepository categoryRepository) {
        if (categoryRepository.count() > 0) return;
        List<String> names = List.of(
            "Appliances",
            "Audio & Video",
            "Computers",
            "Electronics",
            "Furniture",
            "Home & Kitchen",
            "Mobile",
            "Accessories"
        );
        for (String name : names) {
            Category category = new Category();
            category.setName(name);
            categoryRepository.save(category);
        }
    }

    private void seedConditionLevels(ConditionLevelRepository conditionLevelRepository) {
        if (conditionLevelRepository.count() > 0) return;
        List<String> labels = List.of("Like New", "Good", "Fair", "Needs Repair");
        for (String label : labels) {
            ConditionLevel condition = new ConditionLevel();
            condition.setLabel(label);
            conditionLevelRepository.save(condition);
        }
    }

    private User ensureUser(
        String email,
        String displayName,
        String phone,
        UserStatus status,
        String roleName,
        RoleRepository roleRepository,
        UserRepository userRepository,
        UserRoleRepository userRoleRepository,
        PasswordService passwordService
    ) {
        Optional<User> existing = userRepository.findByEmail(email);
        User user = existing.orElseGet(() -> {
            User u = new User();
            u.setEmail(email);
            u.setDisplayName(displayName);
            u.setPhone(phone);
            u.setStatus(status);
            u.setPasswordHash(passwordService.hash("Password123!"));
            return userRepository.save(u);
        });

        Role role = roleRepository.findByName(roleName)
            .orElseGet(() -> {
                Role r = new Role();
                r.setName(roleName);
                return roleRepository.save(r);
            });

        boolean hasRole = userRoleRepository.findByUser_Id(user.getId()).stream()
            .anyMatch(ur -> ur.getRole().getId().equals(role.getId()));
        if (!hasRole) {
            UserRole userRole = new UserRole();
            userRole.setUser(user);
            userRole.setRole(role);
            userRoleRepository.save(userRole);
        }
        return user;
    }

    private void seedProducts(
        User vendor,
        CategoryRepository categoryRepository,
        ProductRepository productRepository,
        ProductImageRepository productImageRepository,
        InventoryRepository inventoryRepository
    ) {
        Map<String, String> imageMap = Map.ofEntries(
            Map.entry("NovaAir Blender", "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("Aurora Soundbar", "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("Nimbus Laptop 14", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("ZenDesk Chair", "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("PixelView Monitor", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("VoltEdge Power Bank", "https://images.unsplash.com/photo-1512499617640-c2f999098c01?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("EchoBuds Wireless", "https://images.unsplash.com/photo-1518441902113-f4f3d223cdcc?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("Orion Phone X", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("LumenDesk Lamp", "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("FlexiCool Mini Fridge", "https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("CraftMate Drill", "https://images.unsplash.com/photo-1503792501406-2c40da09e1e2?auto=format&fit=crop&w=1200&q=80"),
            Map.entry("PulseFit Smartwatch", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80")
        );

        List<SeedProduct> products = List.of(
            new SeedProduct("NovaAir Blender", "Home & Kitchen", "Smooth blends in 45 seconds.", new BigDecimal("6200")),
            new SeedProduct("Aurora Soundbar", "Audio & Video", "Cinematic audio with deep bass.", new BigDecimal("14500")),
            new SeedProduct("Nimbus Laptop 14", "Computers", "Lightweight laptop for creators.", new BigDecimal("84000")),
            new SeedProduct("ZenDesk Chair", "Furniture", "Ergonomic support all day.", new BigDecimal("22500")),
            new SeedProduct("PixelView Monitor", "Computers", "4K color-accurate display.", new BigDecimal("35900")),
            new SeedProduct("VoltEdge Power Bank", "Accessories", "20000mAh fast charging.", new BigDecimal("3200")),
            new SeedProduct("EchoBuds Wireless", "Audio & Video", "Noise cancellation earbuds.", new BigDecimal("7800")),
            new SeedProduct("Orion Phone X", "Mobile", "Flagship camera performance.", new BigDecimal("96000")),
            new SeedProduct("LumenDesk Lamp", "Home & Kitchen", "Warm, dimmable desk lighting.", new BigDecimal("2800")),
            new SeedProduct("FlexiCool Mini Fridge", "Appliances", "Compact cooling for dorms.", new BigDecimal("18900")),
            new SeedProduct("CraftMate Drill", "Appliances", "Multi-speed power drill.", new BigDecimal("11900")),
            new SeedProduct("PulseFit Smartwatch", "Electronics", "Health tracking with 7-day battery.", new BigDecimal("15600"))
        );

        for (SeedProduct sp : products) {
            Category category = categoryRepository.findAll().stream()
                .filter(c -> c.getName().equalsIgnoreCase(sp.category()))
                .findFirst()
                .orElseThrow();

            Product product = new Product();
            product.setVendor(vendor);
            product.setCategory(category);
            product.setName(sp.name());
            product.setDescription(sp.description());
            product.setPriceBdt(sp.price());
            product.setStatus(ProductStatus.ACTIVE);
            product = productRepository.save(product);

            String url = imageMap.getOrDefault(sp.name(), "https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1200&q=80");
            ProductImage image = new ProductImage();
            image.setProduct(product);
            image.setImageUrl(url);
            image.setSortOrder(0);
            productImageRepository.save(image);

            Inventory inventory = new Inventory();
            inventory.setProduct(product);
            inventory.setStockQty(ThreadLocalRandom.current().nextInt(12, 60));
            inventory.setLowStockThreshold(5);
            inventoryRepository.save(inventory);
        }
    }

    private void seedUsedListings(
        User customer,
        CategoryRepository categoryRepository,
        ConditionLevelRepository conditionLevelRepository,
        UsedListingRepository usedListingRepository,
        UsedImageRepository usedImageRepository,
        UsedVideoRepository usedVideoRepository,
        UsedItemHistoryRepository usedItemHistoryRepository
    ) {
        List<ConditionLevel> levels = conditionLevelRepository.findAll();
        List<Category> categories = categoryRepository.findAll();

        List<SeedUsed> seeds = List.of(
            new SeedUsed("Quartz Wireless Keyboard", "Minimal mechanical keyboard", "Accessories", "Good", WarrantyFlag.NO, new BigDecimal("3500")),
            new SeedUsed("Amber Accent Chair", "Soft velvet chair, lightly used", "Furniture", "Fair", WarrantyFlag.NO, new BigDecimal("9200")),
            new SeedUsed("Auric Coffee Maker", "Brewed daily, cleaned weekly", "Home & Kitchen", "Good", WarrantyFlag.YES, new BigDecimal("4800")),
            new SeedUsed("Nexus VR Headset", "Light wear, all accessories", "Electronics", "Like New", WarrantyFlag.YES, new BigDecimal("21000")),
            new SeedUsed("Sable DSLR Camera", "Includes 2 lenses", "Electronics", "Good", WarrantyFlag.NO, new BigDecimal("26500"))
        );

        for (SeedUsed seed : seeds) {
            Category category = categories.stream().filter(c -> c.getName().equalsIgnoreCase(seed.category())).findFirst().orElseThrow();
            ConditionLevel level = levels.stream().filter(l -> l.getLabel().equalsIgnoreCase(seed.condition())).findFirst().orElseThrow();

            UsedListing listing = new UsedListing();
            listing.setSeller(customer);
            listing.setCategory(category);
            listing.setConditionLevel(level);
            listing.setTitle(seed.title());
            listing.setDescription(seed.description());
            listing.setPriceBdt(seed.price());
            listing.setWarrantyFlag(seed.warranty());
            listing.setStatus(UsedListingStatus.ACTIVE);
            listing = usedListingRepository.save(listing);

            UsedImage img = new UsedImage();
            img.setListing(listing);
            img.setImageUrl("https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80");
            img.setSortOrder(0);
            usedImageRepository.save(img);

            UsedVideo vid = new UsedVideo();
            vid.setListing(listing);
            vid.setVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
            usedVideoRepository.save(vid);

            UsedItemHistory history = new UsedItemHistory();
            history.setListing(listing);
            history.setOwnerCount(ThreadLocalRandom.current().nextInt(1, 3));
            history.setUsageDurationMonths(ThreadLocalRandom.current().nextInt(6, 24));
            usedItemHistoryRepository.save(history);
        }
    }

    private void seedTechnicians(
        User techUser,
        TechnicianRepository technicianRepository,
        ServiceListingRepository serviceListingRepository
    ) {
        Technician technician = new Technician();
        technician.setUser(techUser);
        technician.setSpecialization(TechnicianSpecialization.ELECTRONICS);
        technician.setPickupAvailable(true);
        technician.setLevel(TechnicianLevel.VERIFIED);
        technician.setRatingAvg(new BigDecimal("4.6"));
        technician.setCompletionRate(new BigDecimal("96.50"));
        technician = technicianRepository.save(technician);

        ServiceListing listing = new ServiceListing();
        listing.setTechnician(technician);
        listing.setCategory("Electronics");
        listing.setPriceMinBdt(new BigDecimal("1200"));
        listing.setPriceMaxBdt(new BigDecimal("5200"));
        listing.setAvailabilityNote("Weekdays, pickup available");
        listing.setStatus(ServiceStatus.ACTIVE);
        serviceListingRepository.save(listing);
    }

    private void seedAuctions(
        User vendor,
        User customer,
        AuctionRepository auctionRepository,
        AuctionLotRepository auctionLotRepository,
        AuctionImageRepository auctionImageRepository,
        BidRepository bidRepository
    ) {
        Auction auction = new Auction();
        auction.setVendor(vendor);
        auction.setTitle("Spring Tech Drop");
        auction.setType(AuctionType.STANDARD);
        auction.setStatus(AuctionStatus.ACTIVE);
        auction.setStartTime(LocalDateTime.now().minusHours(1));
        auction.setEndTime(LocalDateTime.now().plusHours(3));
        auction.setReservePriceBdt(new BigDecimal("8000"));
        auction = auctionRepository.save(auction);

        AuctionLot lot = new AuctionLot();
        lot.setAuction(auction);
        lot.setTitle("Atlas Mechanical Keyboard");
        lot.setDescription("Limited edition mechanical keyboard.");
        lot.setStartingPriceBdt(new BigDecimal("5000"));
        lot.setCurrentBidBdt(new BigDecimal("6200"));
        lot.setStatus(LotStatus.ACTIVE);
        lot = auctionLotRepository.save(lot);

        AuctionImage ai = new AuctionImage();
        ai.setLot(lot);
        ai.setImageUrl("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80");
        auctionImageRepository.save(ai);

        Bid bid = new Bid();
        bid.setLot(lot);
        bid.setBidder(customer);
        bid.setAmountBdt(new BigDecimal("6200"));
        bidRepository.save(bid);
    }

    private void seedDemoOrder(User customer, ProductRepository productRepository, OrderService orderService) {
        if (productRepository.count() == 0) return;

        Product product = productRepository.findAll().stream().findFirst().orElse(null);
        if (product == null) return;

        List<OrderService.CreateOrderItem> items = List.of(
            new OrderService.CreateOrderItem(product.getId(), 1)
        );

        try {
            orderService.createOrder(customer.getId(), items);
        } catch (Exception ignored) {
        }
    }

    private void seedTrustScores(
            UserRepository userRepository,
            TrustScoreService trustScoreService,
            TrustScoreRepository trustScoreRepository,
            TrustEventRepository trustEventRepository,
            User vendor, User customer, User tech, User admin) {
        if (trustScoreRepository.count() > 0) return;

        trustScoreService.applyEvent(vendor.getId(), "SELLER_VERIFIED", new BigDecimal("15.00"));
        trustScoreService.applyEvent(vendor.getId(), "ORDER_COMPLETED", new BigDecimal("5.00"));
        trustScoreService.applyEvent(customer.getId(), "ACCOUNT_CREATED", new BigDecimal("10.00"));
        trustScoreService.applyEvent(customer.getId(), "ORDER_COMPLETED", new BigDecimal("3.00"));
        trustScoreService.applyEvent(tech.getId(), "TECHNICIAN_VERIFIED", new BigDecimal("12.00"));
        trustScoreService.applyEvent(admin.getId(), "ADMIN_GRANTED", new BigDecimal("20.00"));
    }

    private void seedFraudFlags(FraudFlagRepository fraudFlagRepository, User customer) {
        if (fraudFlagRepository.count() > 0) return;

        FraudFlag flag = new FraudFlag();
        flag.setUser(customer);
        flag.setReason("Suspicious return pattern detected");
        flag.setStatus(FraudFlagStatus.OPEN);
        fraudFlagRepository.save(flag);
    }

    private record SeedProduct(String name, String category, String description, BigDecimal price) {}

    private record SeedUsed(String title, String description, String category, String condition, WarrantyFlag warranty, BigDecimal price) {}

    private static class AuthRoles {
        static final String ADMIN = "ADMIN";
        static final String VENDOR = "VENDOR";
        static final String CUSTOMER = "CUSTOMER";
        static final String TECHNICIAN = "TECHNICIAN";
    }
}
