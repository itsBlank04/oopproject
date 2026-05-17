package atom.example.demo;

import atom.example.demo.category.Category;
import atom.example.demo.category.CategoryRepository;
import atom.example.demo.model.ConditionLevel;
import atom.example.demo.model.PlatformSetting;
import atom.example.demo.model.Role;
import atom.example.demo.repository.ConditionLevelRepository;
import atom.example.demo.repository.PlatformSettingRepository;
import atom.example.demo.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final CategoryRepository categoryRepository;
    private final ConditionLevelRepository conditionLevelRepository;
    private final PlatformSettingRepository platformSettingRepository;

    public DataInitializer(RoleRepository roleRepository, CategoryRepository categoryRepository,
                           ConditionLevelRepository conditionLevelRepository,
                           PlatformSettingRepository platformSettingRepository) {
        this.roleRepository = roleRepository;
        this.categoryRepository = categoryRepository;
        this.conditionLevelRepository = conditionLevelRepository;
        this.platformSettingRepository = platformSettingRepository;
    }

    @Override
    public void run(String... args) {
        for (String name : new String[]{Role.ROLE_CUSTOMER, Role.ROLE_VENDOR, Role.ROLE_TECHNICIAN, Role.ROLE_ADMIN}) {
            if (roleRepository.findByName(name).isEmpty()) {
                roleRepository.save(new Role(name));
            }
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
    }
}
