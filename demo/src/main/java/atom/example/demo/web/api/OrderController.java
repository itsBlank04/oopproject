package atom.example.demo.web.api;

import atom.example.demo.model.Address;
import atom.example.demo.model.Cart;
import atom.example.demo.model.CartItem;
import atom.example.demo.model.Coupon;
import atom.example.demo.model.Order;
import atom.example.demo.model.Product;
import atom.example.demo.model.User;
import atom.example.demo.repository.AddressRepository;
import atom.example.demo.repository.CartItemRepository;
import atom.example.demo.repository.CartRepository;
import atom.example.demo.repository.CouponRepository;
import atom.example.demo.repository.OrderRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;

    public OrderController(OrderRepository orderRepository, CartRepository cartRepository,
            CartItemRepository cartItemRepository, AddressRepository addressRepository,
            CouponRepository couponRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.addressRepository = addressRepository;
        this.couponRepository = couponRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    @Transactional
    public Order checkout(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Cart cart = cartRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Cart is empty"));
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }
        Long addressId = Long.valueOf(body.get("shippingAddressId").toString());
        Address address = addressRepository.findById(addressId)
            .orElseThrow(() -> new IllegalArgumentException("Address not found"));
        Coupon coupon = null;
        if (body.containsKey("couponCode") && body.get("couponCode") != null) {
            coupon = couponRepository.findByCodeAndIsActiveTrue(body.get("couponCode").toString())
                .orElse(null);
        }
        Order order = new Order();
        order.setCustomer(user);
        order.setShippingAddress(address);
        order.setCoupon(coupon);
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem ci : cartItems) {
            Product p = ci.getProduct();
            BigDecimal lineTotal = p.getPriceBdt().multiply(BigDecimal.valueOf(ci.getQty()));
            subtotal = subtotal.add(lineTotal);
        }
        order.setSubtotalBdt(subtotal);
        BigDecimal discount = BigDecimal.ZERO;
        if (coupon != null) {
            if ("PERCENT".equals(coupon.getDiscountType())) {
                discount = subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
                if (coupon.getMaxDiscountBdt() != null && discount.compareTo(coupon.getMaxDiscountBdt()) > 0) {
                    discount = coupon.getMaxDiscountBdt();
                }
            } else if ("FLAT".equals(coupon.getDiscountType())) {
                discount = coupon.getDiscountValue();
            }
        }
        order.setDiscountBdt(discount);
        order.setTotalBdt(subtotal.subtract(discount));
        order.setStatus("PLACED");
        Order saved = orderRepository.save(order);
        cartItemRepository.deleteByCartId(cart.getId());
        return saved;
    }

    @GetMapping
    public List<Order> listOrders(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/{id}")
    public Order getOrder(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        List<Order> orders = orderRepository.findByIdAndCustomerId(id, userId);
        if (orders.isEmpty()) {
            throw new IllegalArgumentException("Order not found");
        }
        return orders.get(0);
    }
}
