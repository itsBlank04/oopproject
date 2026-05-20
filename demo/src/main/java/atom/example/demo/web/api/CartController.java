package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Cart;
import atom.example.demo.model.CartItem;
import atom.example.demo.model.Inventory;
import atom.example.demo.model.Product;
import atom.example.demo.model.User;
import atom.example.demo.repository.CartItemRepository;
import atom.example.demo.repository.CartRepository;
import atom.example.demo.repository.InventoryRepository;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
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

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InventoryRepository inventoryRepository;

    public CartController(CartRepository cartRepository, CartItemRepository cartItemRepository,
            ProductRepository productRepository, UserRepository userRepository,
            InventoryRepository inventoryRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @GetMapping
    public Cart getCart(HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        return cartRepository.findByUserId(userId).orElse(null);
    }

    @PostMapping("/items")
    public CartItem addItem(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = new Cart();
            newCart.setUser(user);
            return cartRepository.save(newCart);
        });
        Long productId = Long.valueOf(body.get("productId").toString());
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        int qty = body.containsKey("qty") ? Integer.parseInt(body.get("qty").toString()) : 1;
        CartItem item = new CartItem();
        item.setCart(cart);
        item.setProduct(product);
        item.setQty(qty);
        return cartItemRepository.save(item);
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
        item.setQty(newQty);
        return cartItemRepository.save(item);
    }

    @DeleteMapping("/items/{id}")
    public String removeItem(@PathVariable Long id) {
        cartItemRepository.deleteById(id);
        return "ok";
    }

    @DeleteMapping
    public String clearCart(HttpSession session) {
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cartItemRepository.deleteByCartId(cart.getId());
        });
        return "ok";
    }
}
