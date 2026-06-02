package atom.example.demo.service;

import atom.example.demo.model.Cart;
import atom.example.demo.model.CartItem;
import atom.example.demo.model.Product;
import atom.example.demo.model.ProductVariant;
import atom.example.demo.model.User;
import atom.example.demo.model.UsedListing;
import atom.example.demo.repository.CartItemRepository;
import atom.example.demo.repository.CartRepository;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.ProductVariantRepository;
import atom.example.demo.repository.UsedListingRepository;
import atom.example.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UsedListingRepository usedListingRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
            UserRepository userRepository, ProductRepository productRepository,
            ProductVariantRepository productVariantRepository,
            UsedListingRepository usedListingRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.usedListingRepository = usedListingRepository;
    }

    @Transactional
    public Cart getActiveCart(Long userId) {
        return cartRepository.findByUserIdAndStatus(userId, "ACTIVE")
            .orElseGet(() -> {
                // Try to find any existing cart and reset it
                Cart existing = cartRepository.findByUserId(userId);
                if (existing != null) {
                    existing.setStatus("ACTIVE");
                    existing.getItems().clear();
                    return cartRepository.save(existing);
                }
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
                Cart cart = new Cart();
                cart.setUser(user);
                cart.setStatus("ACTIVE");
                return cartRepository.save(cart);
            });
    }

    @Transactional
    public Cart getCartByUser(Long userId) {
        return cartRepository.findByUserIdAndStatus(userId, "ACTIVE").orElse(null);
    }

    @Transactional
    public CartItem addItem(Long userId, String itemType, Long productId, Long variantId,
            Long usedListingId, int qty) {
        Cart cart = getActiveCart(userId);

        for (CartItem ci : cart.getItems()) {
            if (productId != null && ci.getProduct() != null && ci.getProduct().getId().equals(productId)) {
                ci.setQty(ci.getQty() + qty);
                return cartItemRepository.save(ci);
            }
        }

        CartItem item = new CartItem();
        item.setCart(cart);
        item.setItemType(itemType != null ? itemType : "PRODUCT");
        item.setQty(qty);

        if (productId != null) {
            Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            if (product.getVendor() != null && product.getVendor().getId().equals(userId)) {
                throw new IllegalArgumentException("You cannot add your own product to cart");
            }
            item.setProduct(product);
        }

        if (variantId != null) {
            ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalArgumentException("Product variant not found"));
            item.setProductVariant(variant);
        }

        if (usedListingId != null) {
            UsedListing usedListing = usedListingRepository.findById(usedListingId)
                .orElseThrow(() -> new IllegalArgumentException("Used listing not found"));
            if (usedListing.getSeller() != null && usedListing.getSeller().getId().equals(userId)) {
                throw new IllegalArgumentException("You cannot add your own listing to cart");
            }
            item.setUsedListing(usedListing);
        }

        return cartItemRepository.save(item);
    }

    @Transactional
    public CartItem updateItemQty(Long itemId, int qty, Long userId) {
        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        if (!item.getCart().getUser().getId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        if (!"ACTIVE".equals(item.getCart().getStatus())) {
            throw new IllegalArgumentException("Cart is not active");
        }
        item.setQty(qty);
        return cartItemRepository.save(item);
    }

    @Transactional
    public void removeItem(Long itemId, Long userId) {
        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        if (!item.getCart().getUser().getId().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        Cart cart = item.getCart();
        cart.getItems().remove(item);
        cartRepository.save(cart);
    }

    @Transactional
    public void clearCart(Long cartId) {
        cartItemRepository.deleteByCartId(cartId);
    }

    @Transactional
    public Cart initiateCheckout(Long userId) {
        Cart cart = getActiveCart(userId);
        if (cart.getItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }
        cart.setStatus("PENDING_CHECKOUT");
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart completeCheckout(Long userId) {
        Cart cart = cartRepository.findByUserIdAndStatus(userId, "PENDING_CHECKOUT")
            .orElseThrow(() -> new IllegalArgumentException("No pending checkout cart"));
        cart.setStatus("COMPLETED");
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart cancelCheckout(Long userId) {
        Cart cart = cartRepository.findByUserIdAndStatus(userId, "PENDING_CHECKOUT")
            .orElseThrow(() -> new IllegalArgumentException("No pending checkout cart"));
        cart.setStatus("ACTIVE");
        return cartRepository.save(cart);
    }

    @Transactional
    public Cart resetCartToActive(Long userId) {
        Cart cart = cartRepository.findByUserId(userId);
        if (cart != null) {
            cart.setStatus("ACTIVE");
            return cartRepository.save(cart);
        }
        return null;
    }

    @Transactional
    public Cart getCartStatus(Long userId) {
        return cartRepository.findByUserIdAndStatus(userId, "ACTIVE")
            .orElseGet(() -> cartRepository.findByUserIdAndStatus(userId, "PENDING_CHECKOUT")
                .orElseGet(() -> cartRepository.findByUserIdAndStatus(userId, "COMPLETED")
                    .orElseGet(() -> cartRepository.findByUserIdAndStatus(userId, "CANCELLED")
                        .orElseGet(() -> cartRepository.findByUserIdAndStatus(userId, "ABANDONED")
                            .orElseGet(() -> cartRepository.findByUserIdAndStatus(userId, "EXPIRED")
                                .orElse(null))))));
    }
}
