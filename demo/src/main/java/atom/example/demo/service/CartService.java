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

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository, UserRepository userRepository, ProductRepository productRepository, ProductVariantRepository productVariantRepository, UsedListingRepository usedListingRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productVariantRepository = productVariantRepository;
        this.usedListingRepository = usedListingRepository;
    }

    @Transactional
    public Cart getCart(Long userId) {
        return cartRepository.findByUserId(userId)
            .orElseGet(() -> {
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
                Cart cart = new Cart();
                cart.setUser(user);
                return cartRepository.save(cart);
            });
    }

    @Transactional
    public CartItem addItem(Long cartId, String itemType, Long productId, Long variantId, Long usedListingId, int qty) {
        Cart cart = cartRepository.findById(cartId)
            .orElseThrow(() -> new IllegalArgumentException("Cart not found"));

        CartItem item = new CartItem();
        item.setCart(cart);
        item.setItemType(itemType);
        item.setQty(qty);

        if (productId != null) {
            Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
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
            item.setUsedListing(usedListing);
        }

        return cartItemRepository.save(item);
    }

    @Transactional
    public CartItem updateItemQty(Long itemId, int qty) {
        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        item.setQty(qty);
        return cartItemRepository.save(item);
    }

    @Transactional
    public void removeItem(Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
            .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(Long cartId) {
        Cart cart = cartRepository.findById(cartId)
            .orElseThrow(() -> new IllegalArgumentException("Cart not found"));
        cartItemRepository.deleteByCartId(cartId);
    }
}
