package atom.example.demo.service;

import atom.example.demo.model.Address;
import atom.example.demo.model.Cart;
import atom.example.demo.model.CartItem;
import atom.example.demo.model.Coupon;
import atom.example.demo.model.Inventory;
import atom.example.demo.model.Notification;
import atom.example.demo.model.Order;
import atom.example.demo.model.OrderItem;
import atom.example.demo.model.User;
import atom.example.demo.model.VendorCommission;
import atom.example.demo.repository.AddressRepository;
import atom.example.demo.repository.CartItemRepository;
import atom.example.demo.repository.CouponRepository;
import atom.example.demo.repository.InventoryRepository;
import atom.example.demo.repository.NotificationRepository;
import atom.example.demo.repository.OrderItemRepository;
import atom.example.demo.repository.OrderRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorCommissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartItemRepository cartItemRepository;
    private final CartService cartService;
    private final CouponRepository couponRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final VendorCommissionRepository vendorCommissionRepository;
    private final NotificationRepository notificationRepository;

    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository, CartItemRepository cartItemRepository, CartService cartService, CouponRepository couponRepository, InventoryRepository inventoryRepository, UserRepository userRepository, AddressRepository addressRepository, VendorCommissionRepository vendorCommissionRepository, NotificationRepository notificationRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartItemRepository = cartItemRepository;
        this.cartService = cartService;
        this.couponRepository = couponRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.vendorCommissionRepository = vendorCommissionRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public Order checkout(Long userId, Long shippingAddressId, String couponCode) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Cart cart = cartService.getCart(userId);
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        Address shippingAddress = addressRepository.findById(shippingAddressId)
            .orElseThrow(() -> new IllegalArgumentException("Shipping address not found"));

        // Calculate subtotal first
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem cartItem : cartItems) {
            BigDecimal unitPrice = BigDecimal.ZERO;
            if (cartItem.getProduct() != null) {
                unitPrice = cartItem.getProduct().getPriceBdt();
            } else if (cartItem.getUsedListing() != null) {
                unitPrice = cartItem.getUsedListing().getPriceBdt();
            }
            subtotal = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(cartItem.getQty())));
        }

        // Calculate discount
        BigDecimal discount = BigDecimal.ZERO;
        Coupon coupon = null;
        if (couponCode != null && !couponCode.isEmpty()) {
            coupon = couponRepository.findByCodeAndIsActiveTrue(couponCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid coupon code"));

            if ("PERCENT".equals(coupon.getDiscountType())) {
                discount = subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                if (coupon.getMaxDiscountBdt() != null && discount.compareTo(coupon.getMaxDiscountBdt()) > 0) {
                    discount = coupon.getMaxDiscountBdt();
                }
            } else if ("FLAT".equals(coupon.getDiscountType())) {
                discount = coupon.getDiscountValue();
            }
        }

        BigDecimal shippingFee = new BigDecimal("60.00");
        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal total = subtotal.subtract(discount).add(shippingFee).add(tax);

        // Create and SAVE order FIRST (so it gets an ID for FK references)
        Order order = new Order();
        order.setCustomer(user);
        order.setShippingAddress(shippingAddress);
        order.setStatus("PLACED");
        order.setSubtotalBdt(subtotal);
        order.setDiscountBdt(discount);
        order.setShippingFeeBdt(shippingFee);
        order.setTaxBdt(tax);
        order.setTotalBdt(total);
        if (coupon != null) {
            order.setCoupon(coupon);
        }

        Order savedOrder = orderRepository.save(order);

        // NOW create order items (order has an ID)
        for (CartItem cartItem : cartItems) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setItemType(cartItem.getItemType());
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setProductVariant(cartItem.getProductVariant());
            orderItem.setUsedListing(cartItem.getUsedListing());
            orderItem.setQty(cartItem.getQty());

            BigDecimal unitPrice = BigDecimal.ZERO;
            if (cartItem.getProduct() != null) {
                unitPrice = cartItem.getProduct().getPriceBdt();
            } else if (cartItem.getUsedListing() != null) {
                unitPrice = cartItem.getUsedListing().getPriceBdt();
            }
            orderItem.setUnitPriceBdt(unitPrice);
            orderItemRepository.save(orderItem);

            // Decrement inventory
            if (cartItem.getProduct() != null) {
                Long variantId = cartItem.getProductVariant() != null ? cartItem.getProductVariant().getId() : null;
                Inventory inv = variantId != null
                    ? inventoryRepository.findByProductIdAndProductVariantId(cartItem.getProduct().getId(), variantId).orElse(null)
                    : inventoryRepository.findByProductIdAndProductVariantIdIsNull(cartItem.getProduct().getId()).orElse(null);

                if (inv != null) {
                    int newQty = inv.getStockQty() - cartItem.getQty();
                    if (newQty < 0) {
                        throw new IllegalArgumentException("Insufficient stock for: " + cartItem.getProduct().getName());
                    }
                    inv.setStockQty(newQty);
                    inventoryRepository.save(inv);
                }

                // Create vendor commission
                User vendor = cartItem.getProduct().getVendor();
                if (vendor != null) {
                    VendorCommission commission = new VendorCommission();
                    commission.setOrderItem(orderItem);
                    commission.setVendor(vendor);
                    commission.setSaleAmountBdt(unitPrice.multiply(BigDecimal.valueOf(cartItem.getQty())));
                    commission.setCommissionRate(new BigDecimal("10.00"));
                    commission.setCommissionBdt(commission.getSaleAmountBdt().multiply(commission.getCommissionRate()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
                    commission.setNetPayoutBdt(commission.getSaleAmountBdt().subtract(commission.getCommissionBdt()));
                    commission.setStatus("PENDING");
                    vendorCommissionRepository.save(commission);

                    // Notify vendor
                    Notification notification = new Notification();
                    notification.setUser(vendor);
                    notification.setType("NEW_ORDER");
                    notification.setTitle("New order received");
                    notification.setBody("You have a new order for " + cartItem.getProduct().getName() + " (x" + cartItem.getQty() + ")");
                    notification.setEntityType("ORDER");
                    notification.setEntityId(savedOrder.getId());
                    notificationRepository.save(notification);
                }
            }
        }

        // Clear the cart
        cartService.clearCart(cart.getId());

        return savedOrder;
    }

    public List<Order> getOrders(Long userId) {
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(userId);
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
    }
}
