package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.Product;
import atomdrops.example.atomdrops.model.enums.ProductStatus;
import atomdrops.example.atomdrops.service.ProductService;
import atomdrops.example.atomdrops.web.dto.CreateProductRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
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
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<Page<Product>> getAll(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String q,
            Pageable pageable) {
        if (q != null && !q.isBlank()) {
            return ResponseEntity.ok(productService.search(q, pageable));
        }
        if (categoryId != null) {
            return ResponseEntity.ok(productService.findByCategory(categoryId, pageable));
        }
        return ResponseEntity.ok(productService.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.findById(id));
    }

    @GetMapping("/mine")
    public ResponseEntity<Page<Product>> getMine(HttpSession session, Pageable pageable) {
        Long userId = getUserId(session);
        return ResponseEntity.ok(productService.findByVendor(userId, pageable));
    }

    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody CreateProductRequest req, HttpSession session) {
        Long userId = getUserId(session);
        String role = (String) session.getAttribute("role");
        if (!"VENDOR".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Product product = productService.create(
            req.getName(), req.getDescription(), req.getPriceBdt(),
            req.getCategoryId(), userId, req.getImageUrls());
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @Valid @RequestBody CreateProductRequest req, HttpSession session) {
        Long userId = getUserId(session);
        try {
            productService.verifyOwner(id, userId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        Product product = productService.update(
            id, req.getName(), req.getDescription(), req.getPriceBdt(),
            req.getCategoryId(), null);
        return ResponseEntity.ok(product);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, HttpSession session) {
        Long userId = getUserId(session);
        try {
            productService.verifyOwner(id, userId);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Long getUserId(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        return userId;
    }
}
