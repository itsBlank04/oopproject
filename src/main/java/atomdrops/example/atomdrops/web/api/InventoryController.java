package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.Inventory;
import atomdrops.example.atomdrops.repository.InventoryRepository;
import atomdrops.example.atomdrops.repository.ProductRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    public InventoryController(InventoryRepository inventoryRepository, ProductRepository productRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Inventory>> getLowStock(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        String role = (String) session.getAttribute("role");
        List<Inventory> all = inventoryRepository.findAll();
        List<Inventory> lowStock = all.stream()
            .filter(i -> i.getStockQty() <= i.getLowStockThreshold())
            .toList();
        return ResponseEntity.ok(lowStock);
    }

    @PostMapping("/{productId}/threshold")
    public ResponseEntity<?> updateThreshold(@PathVariable Long productId, @RequestBody Map<String, Integer> body, HttpSession session) {
        String role = (String) session.getAttribute("role");
        if (!"VENDOR".equals(role) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Integer threshold = body.get("threshold");
        if (threshold == null || threshold < 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "threshold must be a non-negative integer"));
        }
        Inventory inv = inventoryRepository.findByProduct_Id(productId)
            .orElse(null);
        if (inv == null) {
            inv = new Inventory();
            inv.setProduct(productRepository.getReferenceById(productId));
        }
        inv.setLowStockThreshold(threshold);
        inventoryRepository.save(inv);
        return ResponseEntity.ok(Map.of("message", "Threshold updated"));
    }
}
