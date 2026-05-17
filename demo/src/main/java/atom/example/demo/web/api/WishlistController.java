package atom.example.demo.web.api;

import atom.example.demo.model.Product;
import atom.example.demo.model.User;
import atom.example.demo.model.Wishlist;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.WishlistRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public WishlistController(WishlistRepository wishlistRepository, UserRepository userRepository,
            ProductRepository productRepository) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Wishlist> listWishlist(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return wishlistRepository.findByUserId(userId);
    }

    @PostMapping("/{productId}")
    public Wishlist addToWishlist(@PathVariable Long productId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        Wishlist wishlist = new Wishlist();
        wishlist.setUser(user);
        wishlist.setProduct(product);
        return wishlistRepository.save(wishlist);
    }

    @DeleteMapping("/{productId}")
    public String removeFromWishlist(@PathVariable Long productId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
        return "ok";
    }
}
