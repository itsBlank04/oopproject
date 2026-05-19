package atom.example.demo.product;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Inventory;
import atom.example.demo.model.Product;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
public class InventoryController {

    private final ProductService productService;

    public InventoryController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/{productId}/inventory")
    public Inventory getInventory(@PathVariable Long productId, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Product product = productService.getProduct(productId);
        if (!product.getVendor().getId().equals(userId)) throw new SecurityException("Not your product");
        return productService.getInventory(productId);
    }

    @PutMapping("/{productId}/inventory")
    public Inventory updateInventory(@PathVariable Long productId, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("VENDOR")) throw new SecurityException("Vendor access required");
        Product product = productService.getProduct(productId);
        if (!product.getVendor().getId().equals(userId)) throw new SecurityException("Not your product");
        int stockQty = ((Number) body.get("stockQty")).intValue();
        int lowStockThreshold = body.containsKey("lowStockThreshold") ? ((Number) body.get("lowStockThreshold")).intValue() : 5;
        return productService.updateInventory(productId, stockQty, lowStockThreshold);
    }
}
