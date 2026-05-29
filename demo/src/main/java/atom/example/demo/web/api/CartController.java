package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Cart;
import atom.example.demo.model.CartItem;
import atom.example.demo.model.Inventory;
import atom.example.demo.repository.CartItemRepository;
import atom.example.demo.repository.CartRepository;
import atom.example.demo.repository.InventoryRepository;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.service.CartService;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;

    public CartController(CartService cartService, CartRepository cartRepository,
            CartItemRepository cartItemRepository, ProductRepository productRepository,
            UserRepository userRepository, InventoryRepository inventoryRepository) {
        this.cartService = cartService;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @GetMapping
    public Cart getCart() {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        return cartService.getActiveCart(userId);
    }

    @GetMapping("/status")
    public Map<String, Object> getCartStatus() {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Cart cart = cartService.getCartStatus(userId);
        if (cart == null) {
            return Map.of("status", "NONE", "cart", null);
        }
        return Map.of("status", cart.getStatus(), "cart", cart);
    }

    @PostMapping("/items")
    public CartItem addItem(@RequestBody Map<String, Object> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");

        Long productId = body.containsKey("productId") ? Long.valueOf(body.get("productId").toString()) : null;
        Long variantId = body.containsKey("variantId") ? Long.valueOf(body.get("variantId").toString()) : null;
        Long usedListingId = body.containsKey("usedListingId") ? Long.valueOf(body.get("usedListingId").toString()) : null;
        int qty = body.containsKey("qty") ? Integer.parseInt(body.get("qty").toString()) : 1;

        return cartService.addItem(userId, "PRODUCT", productId, variantId, usedListingId, qty);
    }

    @PutMapping("/items/{id}")
    public CartItem updateItemQty(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");

        CartItem item = cartItemRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        if (!item.getCart().getUser().getId().equals(userId)) {
            throw new SecurityException("Access denied");
        }

        int newQty = body.get("qty");
        if (item.getProduct() != null) {
            Inventory inv = inventoryRepository
                .findByProductIdAndProductVariantIdIsNull(item.getProduct().getId())
                .orElse(null);
            if (inv != null && newQty > inv.getStockQty()) {
                throw new IllegalArgumentException("Insufficient stock. Available: " + inv.getStockQty());
            }
        }

        return cartService.updateItemQty(id, newQty, userId);
    }

    @DeleteMapping("/items/{id}")
    public String removeItem(@PathVariable Long id) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        cartService.removeItem(id, userId);
        return "ok";
    }

    @DeleteMapping
    public String clearCart() {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");

        Cart cart = cartService.getCartByUser(userId);
        if (cart != null) {
            cartService.clearCart(cart.getId());
        }
        return "ok";
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> initiateCheckout() {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");

        Cart cart = cartService.initiateCheckout(userId);
        return ResponseEntity.ok(Map.of("status", "PENDING_CHECKOUT", "cart", cart));
    }

    @PostMapping("/checkout/complete")
    public ResponseEntity<?> completeCheckout() {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");

        Cart cart = cartService.completeCheckout(userId);
        return ResponseEntity.ok(Map.of("status", "COMPLETED", "cart", cart));
    }

    @PostMapping("/checkout/cancel")
    public ResponseEntity<?> cancelCheckout() {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");

        Cart cart = cartService.cancelCheckout(userId);
        return ResponseEntity.ok(Map.of("status", "ACTIVE", "cart", cart));
    }
}
