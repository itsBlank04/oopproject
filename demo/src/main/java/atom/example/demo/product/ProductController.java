package atom.example.demo.product;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Product;
import atom.example.demo.model.User;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final UserRepository userRepository;

    public ProductController(ProductService productService, UserRepository userRepository) {
        this.productService = productService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public Page<Product> listProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return productService.searchProducts(search, category, minPrice, maxPrice,
            PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public Product getProduct(@PathVariable Long id) {
        return productService.getProduct(id);
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        if (!SecurityConfig.hasRole("VENDOR")) {
            throw new SecurityException("Vendor access required");
        }
        User vendor = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        product.setVendor(vendor);
        product.setStatus("ACTIVE");
        return productService.createProduct(product);
    }

    @PutMapping("/{id}")
    public Product updateProduct(@PathVariable Long id, @RequestBody Product product, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Product existing = productService.getProduct(id);
        if (!existing.getVendor().getId().equals(userId)) throw new SecurityException("Not your product");
        return productService.updateProduct(id, product);
    }

    @DeleteMapping("/{id}")
    public String deleteProduct(@PathVariable Long id, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Product existing = productService.getProduct(id);
        if (!existing.getVendor().getId().equals(userId)) throw new SecurityException("Not your product");
        productService.softDeleteProduct(id);
        return "ok";
    }
}
