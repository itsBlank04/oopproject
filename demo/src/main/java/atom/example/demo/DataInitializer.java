package atom.example.demo;

import atom.example.demo.auth.AuthService;
import atom.example.demo.category.Category;
import atom.example.demo.category.CategoryRepository;
import atom.example.demo.model.ConditionLevel;
import atom.example.demo.model.PlatformSetting;
import atom.example.demo.model.Role;
import atom.example.demo.model.User;
import atom.example.demo.model.VendorSubscriptionPlan;
import atom.example.demo.repository.ConditionLevelRepository;
import atom.example.demo.repository.PlatformSettingRepository;
import atom.example.demo.repository.RoleRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorSubscriptionPlanRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_EMAIL = "admin@login.com";
    private static final String ADMIN_PASSWORD = "88888888";

    private final RoleRepository roleRepository;
    private final CategoryRepository categoryRepository;
    private final ConditionLevelRepository conditionLevelRepository;
    private final PlatformSettingRepository platformSettingRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final VendorSubscriptionPlanRepository vendorSubscriptionPlanRepository;

    public DataInitializer(RoleRepository roleRepository, CategoryRepository categoryRepository,
                           ConditionLevelRepository conditionLevelRepository,
                           PlatformSettingRepository platformSettingRepository,
                           UserRepository userRepository,
                           AuthService authService,
                           VendorSubscriptionPlanRepository vendorSubscriptionPlanRepository) {
        this.roleRepository = roleRepository;
        this.categoryRepository = categoryRepository;
        this.conditionLevelRepository = conditionLevelRepository;
        this.platformSettingRepository = platformSettingRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.vendorSubscriptionPlanRepository = vendorSubscriptionPlanRepository;
    }

    @Override
    public void run(String... args) {
        for (String name : new String[]{Role.ROLE_CUSTOMER, Role.ROLE_VENDOR, Role.ROLE_TECHNICIAN, Role.ROLE_ADMIN}) {
            if (roleRepository.findByName(name).isEmpty()) {
                roleRepository.save(new Role(name));
            }
        }

        // Auto-create primary admin account
        if (userRepository.findByEmail(ADMIN_EMAIL).isEmpty()) {
            authService.register(ADMIN_EMAIL, ADMIN_PASSWORD, "System Admin", List.of(Role.ROLE_ADMIN));
        }

        if (categoryRepository.count() == 0) {
            String[][] categories = {
                {"Smartphones & Tablets", "smartphones-tablets"},
                {"Laptops & Computers", "laptops-computers"},
                {"TVs & Home Entertainment", "tvs-home-entertainment"},
                {"Audio & Headphones", "audio-headphones"},
                {"Gaming & Consoles", "gaming-consoles"},
                {"Cameras & Drones", "cameras-drones"},
                {"Home Appliances", "home-appliances"},
                {"Fashion & Accessories", "fashion-accessories"},
                {"Beauty & Personal Care", "beauty-personal-care"},
                {"Sports & Outdoors", "sports-outdoors"},
            };
            for (int i = 0; i < categories.length; i++) {
                Category cat = new Category();
                cat.setName(categories[i][0]);
                cat.setSlug(categories[i][1]);
                cat.setSortOrder(i);
                categoryRepository.save(cat);
            }
        }

        if (conditionLevelRepository.count() == 0) {
            String[][] levels = {{"Like New", "1"}, {"Good", "2"}, {"Fair", "3"}, {"Needs Repair", "4"}};
            for (String[] level : levels) {
                ConditionLevel cl = new ConditionLevel();
                cl.setLabel(level[0]);
                cl.setSortOrder(Integer.parseInt(level[1]));
                conditionLevelRepository.save(cl);
            }
        }

        if (platformSettingRepository.count() == 0) {
            String[][] settings = {
                {"vendor.commission_rate", "10.00", "DECIMAL"},
                {"technician.commission_rate", "8.00", "DECIMAL"},
                {"trust.initial_score", "50.00", "DECIMAL"},
                {"trust.low_score_threshold", "30.00", "DECIMAL"},
                {"trust.ban_threshold", "10.00", "DECIMAL"},
                {"auction.default_bid_increment", "10.00", "DECIMAL"},
                {"auction.extension_minutes", "5", "INTEGER"},
                {"auction.max_extensions", "3", "INTEGER"},
                {"auction.payment_deadline_hours", "48", "INTEGER"},
                {"cart.expiry_hours", "24", "INTEGER"},
                {"shipping.default_fee_bdt", "60.00", "DECIMAL"},
            };
            for (String[] s : settings) {
                PlatformSetting ps = new PlatformSetting();
                ps.setKey(s[0]);
                ps.setValue(s[1]);
                ps.setDataType(s[2]);
                platformSettingRepository.save(ps);
            }
        }

        // Seed vendor subscription plans
        if (vendorSubscriptionPlanRepository.count() == 0) {
            vendorSubscriptionPlanRepository.save(new VendorSubscriptionPlan(
                "BASIC", "Vendor Basic", 1, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "[\"1 shop forever free\"]"));
            vendorSubscriptionPlanRepository.save(new VendorSubscriptionPlan(
                "BUILDER", "Vendor Builder", 2, new BigDecimal("499.00"), new BigDecimal("4999.00"), new BigDecimal("15.00"), "[\"2 shops\"]"));
            vendorSubscriptionPlanRepository.save(new VendorSubscriptionPlan(
                "PRO", "Vendor Pro", 4, new BigDecimal("999.00"), new BigDecimal("9599.00"), new BigDecimal("20.00"), "[\"4 shops\", \"Promotions\"]"));
            vendorSubscriptionPlanRepository.save(new VendorSubscriptionPlan(
                "BUSINESS", "Vendor Business", 7, new BigDecimal("1999.00"), new BigDecimal("17999.00"), new BigDecimal("25.00"), "[\"7 shops\", \"Promotions\", \"Priority Support\", \"Staff Management\"]"));
            vendorSubscriptionPlanRepository.save(new VendorSubscriptionPlan(
                "ENTERPRISE", "Vendor Enterprise", -1, new BigDecimal("4999.00"), new BigDecimal("47999.00"), new BigDecimal("20.00"), "[\"Unlimited shops\", \"Staff Management\", \"Priority Support\"]"));
        }
    }
}
