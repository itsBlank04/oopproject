package atom.example.demo.service;

import atom.example.demo.model.Address;
import atom.example.demo.model.BanHistory;
import atom.example.demo.model.Cart;
import atom.example.demo.model.CartItem;
import atom.example.demo.model.Conversation;
import atom.example.demo.model.ConversationMember;
import atom.example.demo.model.Coupon;
import atom.example.demo.model.Inventory;
import atom.example.demo.model.Notification;
import atom.example.demo.model.Order;
import atom.example.demo.model.OrderItem;
import atom.example.demo.model.TrustEvent;
import atom.example.demo.model.TrustScore;
import atom.example.demo.model.User;
import atom.example.demo.model.VendorCommission;
import atom.example.demo.repository.AddressRepository;
import atom.example.demo.repository.BanHistoryRepository;
import atom.example.demo.repository.CartItemRepository;
import atom.example.demo.repository.ConversationMemberRepository;
import atom.example.demo.repository.ConversationRepository;
import atom.example.demo.repository.CouponRepository;
import atom.example.demo.repository.InventoryRepository;
import atom.example.demo.repository.NotificationRepository;
import atom.example.demo.repository.OrderItemRepository;
import atom.example.demo.repository.OrderRepository;
import atom.example.demo.repository.PlatformSettingRepository;
import atom.example.demo.repository.TrustEventRepository;
import atom.example.demo.repository.TrustScoreRepository;
import atom.example.demo.repository.UserRepository;
import atom.example.demo.repository.VendorCommissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
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
    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final TrustScoreRepository trustScoreRepository;
    private final TrustEventRepository trustEventRepository;
    private final BanHistoryRepository banHistoryRepository;
    private final PlatformSettingRepository platformSettingRepository;

    public OrderService(OrderRepository orderRepository, OrderItemRepository orderItemRepository, CartItemRepository cartItemRepository, CartService cartService, CouponRepository couponRepository, InventoryRepository inventoryRepository, UserRepository userRepository, AddressRepository addressRepository, VendorCommissionRepository vendorCommissionRepository, NotificationRepository notificationRepository, ConversationRepository conversationRepository, ConversationMemberRepository conversationMemberRepository, TrustScoreRepository trustScoreRepository, TrustEventRepository trustEventRepository, BanHistoryRepository banHistoryRepository, PlatformSettingRepository platformSettingRepository) {
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
        this.conversationRepository = conversationRepository;
        this.conversationMemberRepository = conversationMemberRepository;
        this.trustScoreRepository = trustScoreRepository;
        this.trustEventRepository = trustEventRepository;
        this.banHistoryRepository = banHistoryRepository;
        this.platformSettingRepository = platformSettingRepository;
    }

    @Transactional
    public Order checkout(Long userId, Long shippingAddressId, String couponCode, String shippingOption) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Cart cart = cartService.initiateCheckout(userId);
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        for (CartItem cartItem : cartItems) {
            if (cartItem.getProduct() != null
                && cartItem.getProduct().getVendor() != null
                && cartItem.getProduct().getVendor().getId().equals(userId)) {
                throw new IllegalArgumentException("You cannot purchase your own product");
            }
            if (cartItem.getUsedListing() != null
                && cartItem.getUsedListing().getSeller() != null
                && cartItem.getUsedListing().getSeller().getId().equals(userId)) {
                throw new IllegalArgumentException("You cannot purchase your own listing");
            }
        }

        Address shippingAddress = addressRepository.findById(shippingAddressId)
            .orElseThrow(() -> new IllegalArgumentException("Shipping address not found"));

        // Calculate subtotal first
        BigDecimal subtotal = BigDecimal.ZERO;
        boolean hasPaidShipping = false;
        for (CartItem cartItem : cartItems) {
            BigDecimal unitPrice = BigDecimal.ZERO;
            if (cartItem.getProduct() != null) {
                unitPrice = cartItem.getProduct().getPriceBdt();
                if ("PAID".equals(cartItem.getProduct().getShippingType())) {
                    hasPaidShipping = true;
                }
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

        // Calculate shipping fee
        String resolvedOption = null;
        BigDecimal shippingFee = BigDecimal.ZERO;
        if (hasPaidShipping) {
            if (shippingOption == null || shippingOption.isBlank()) {
                throw new IllegalArgumentException("Shipping option required (INSIDE_DHAKA or OUTSIDE_DHAKA)");
            }
            resolvedOption = shippingOption;
            shippingFee = "INSIDE_DHAKA".equals(shippingOption)
                ? new BigDecimal("60.00")
                : new BigDecimal("100.00");
        }

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

        if (resolvedOption != null) {
            order.setShippingOption(resolvedOption);
        } else {
            order.setShippingOption(null);
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
            savedOrder.getItems().add(orderItem);

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
                    commission.setCommissionRate(BigDecimal.ZERO);
                    commission.setCommissionBdt(BigDecimal.ZERO);
                    commission.setNetPayoutBdt(commission.getSaleAmountBdt());
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

        // Auto-create order conversations (buyer ↔ each vendor)
        for (CartItem cartItem : cartItems) {
            User vendor = resolveVendor(cartItem);
            if (vendor == null || vendor.getId().equals(userId)) continue;
            final User finalVendor = vendor;

            // Check if conversation already exists for this order+vendor
            boolean existingConv = conversationMemberRepository.findByUserId(userId).stream()
                .anyMatch(m -> "ORDER".equals(m.getConversation().getType())
                    && savedOrder.getId().equals(m.getConversation().getEntityId())
                    && conversationMemberRepository.existsByConversationIdAndUserId(m.getConversation().getId(), finalVendor.getId()));
            if (!existingConv) {
                Conversation conv = new Conversation();
                conv.setType("ORDER");
                conv.setEntityType("ORDER");
                conv.setEntityId(savedOrder.getId());
                conv.setTitle("Order #" + savedOrder.getId());
                conv.setStatus("OPEN");
                conv = conversationRepository.save(conv);
                ConversationMember buyerMember = new ConversationMember();
                buyerMember.setConversation(conv);
                buyerMember.setUser(user);
                buyerMember.setRole("BUYER");
                conversationMemberRepository.save(buyerMember);
                ConversationMember sellerMember = new ConversationMember();
                sellerMember.setConversation(conv);
                sellerMember.setUser(finalVendor);
                sellerMember.setRole("SELLER");
                conversationMemberRepository.save(sellerMember);
            }
        }

        // Mark cart as completed
        cartService.completeCheckout(userId);
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

    public List<Order> getVendorOrders(Long vendorId) {
        List<VendorCommission> commissions = vendorCommissionRepository.findByVendorId(vendorId);
        return commissions.stream()
            .map(c -> c.getOrderItem().getOrder())
            .distinct()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .toList();
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, Long vendorId, String newStatus) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        boolean isVendorOrder = vendorCommissionRepository.existsByVendorIdAndOrderId(vendorId, orderId);
        if (!isVendorOrder) throw new SecurityException("Not your order");

        String current = order.getStatus();

        // PLACED → APPROVED (vendor approves)
        if ("PLACED".equals(current) && "APPROVED".equals(newStatus)) {
            order.setStatus("APPROVED");
            Order saved = orderRepository.save(order);
            Notification n = new Notification();
            n.setUser(order.getCustomer());
            n.setType("ORDER_APPROVED");
            n.setTitle("Order #" + orderId + " approved");
            n.setBody("Your order #" + orderId + " has been approved by the vendor.");
            n.setEntityType("ORDER");
            n.setEntityId(orderId);
            notificationRepository.save(n);
            return saved;
        }

        // APPROVED → PACKED (vendor packs)
        if ("APPROVED".equals(current) && "PACKED".equals(newStatus)) {
            order.setStatus("PACKED");
            Order saved = orderRepository.save(order);
            Notification n = new Notification();
            n.setUser(order.getCustomer());
            n.setType("ORDER_PACKED");
            n.setTitle("Order #" + orderId + " packed");
            n.setBody("Your order #" + orderId + " has been packed and is ready for shipping.");
            n.setEntityType("ORDER");
            n.setEntityId(orderId);
            notificationRepository.save(n);
            return saved;
        }

        // PACKED → SHIPPED (vendor ships)
        if ("PACKED".equals(current) && "SHIPPED".equals(newStatus)) {
            order.setStatus("SHIPPED");
            Order saved = orderRepository.save(order);
            Notification n = new Notification();
            n.setUser(order.getCustomer());
            n.setType("ORDER_SHIPPED");
            n.setTitle("Order #" + orderId + " shipped");
            n.setBody("Your order #" + orderId + " has been shipped.");
            n.setEntityType("ORDER");
            n.setEntityId(orderId);
            notificationRepository.save(n);
            return saved;
        }

        // SHIPPED → DELIVERED (vendor marks delivered)
        if ("SHIPPED".equals(current) && "DELIVERED".equals(newStatus)) {
            order.setStatus("DELIVERED");
            Order saved = orderRepository.save(order);
            Notification n = new Notification();
            n.setUser(order.getCustomer());
            n.setType("ORDER_DELIVERED");
            n.setTitle("Order #" + orderId + " delivered");
            n.setBody("Your order #" + orderId + " has been marked as delivered.");
            n.setEntityType("ORDER");
            n.setEntityId(orderId);
            notificationRepository.save(n);

            // Mark COD commissions as PAID so vendor analytics update
            List<VendorCommission> commissions = vendorCommissionRepository.findByOrderId(orderId);
            for (VendorCommission c : commissions) {
                if (!"PAID".equals(c.getStatus())) {
                    c.setStatus("PAID");
                    vendorCommissionRepository.save(c);
                }
            }
            return saved;
        }

        // PLACED → CANCELLED (vendor rejects)
        if ("PLACED".equals(current) && "CANCELLED".equals(newStatus)) {
            order.setStatus("REJECTED");
            Order saved = orderRepository.save(order);
            Notification n = new Notification();
            n.setUser(order.getCustomer());
            n.setType("ORDER_REJECTED");
            n.setTitle("Order #" + orderId + " rejected");
            n.setBody("Your order #" + orderId + " has been rejected by the vendor.");
            n.setEntityType("ORDER");
            n.setEntityId(orderId);
            notificationRepository.save(n);
            return saved;
        }

        throw new IllegalArgumentException("Invalid status transition: " + current + " → " + newStatus);
    }

    @Transactional
    public Order cancelOrder(Long orderId, Long customerId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getCustomer().getId().equals(customerId)) {
            throw new SecurityException("Not your order");
        }

        String status = order.getStatus();
        if ("SHIPPED".equals(status) || "DELIVERED".equals(status)) {
            throw new IllegalArgumentException("Cannot cancel order after it has been shipped");
        }

        // Time limit: cannot cancel if more than 24 hours have passed since creation
        Instant now = Instant.now();
        long hoursSinceCreation = Duration.between(order.getCreatedAt(), now).toHours();
        if (hoursSinceCreation > 24) {
            throw new IllegalArgumentException("Cancellation window has expired (24 hours from order placement)");
        }

        // If cancelling before vendor approval → negative trust score impact
        boolean beforeApproval = "PLACED".equals(status);
        if (beforeApproval) {
            TrustScore trustScore = trustScoreRepository.findByUserId(customerId)
                .orElseGet(() -> {
                    User user = userRepository.findById(customerId)
                        .orElseThrow(() -> new IllegalArgumentException("User not found"));
                    TrustScore ts = new TrustScore();
                    ts.setUser(user);
                    ts.setScore(new BigDecimal("50"));
                    return trustScoreRepository.save(ts);
                });

            BigDecimal penalty = new BigDecimal("-5");
            BigDecimal newScore = trustScore.getScore().add(penalty).max(BigDecimal.ZERO);
            trustScore.setScore(newScore);
            trustScoreRepository.save(trustScore);

            TrustEvent event = new TrustEvent();
            event.setUser(trustScore.getUser());
            event.setEventType("ORDER_CANCELLED_BEFORE_APPROVAL");
            event.setDelta(penalty);
            event.setNote("Cancelled order #" + orderId + " before vendor approval");
            trustEventRepository.save(event);

            // Check ban threshold
            String thresholdStr = platformSettingRepository.findById("trust.ban_threshold")
                .map(s -> s.getValue()).orElse("10");
            BigDecimal threshold = new BigDecimal(thresholdStr);
            if (newScore.compareTo(threshold) <= 0) {
                // Auto-suspend
                BanHistory ban = new BanHistory();
                ban.setUser(trustScore.getUser());
                ban.setAction("SUSPENDED");
                ban.setReason("Trust score dropped to " + newScore + " due to repeated order cancellations before vendor approval");
                ban.setExpiresAt(now.plus(java.time.Duration.ofDays(7)));
                banHistoryRepository.save(ban);

                // Set user status to SUSPENDED
                User user = trustScore.getUser();
                user.setStatus("SUSPENDED");
                userRepository.save(user);
            }
        }

        order.setStatus("CANCELLED");
        Order saved = orderRepository.save(order);

        // Reset cart to ACTIVE so customer can shop again
        cartService.resetCartToActive(customerId);

        Notification n = new Notification();
        n.setUser(order.getCustomer());
        n.setType("ORDER_CANCELLED");
        n.setTitle("Order #" + orderId + " cancelled");
        n.setBody("Your order #" + orderId + " has been cancelled.");
        n.setEntityType("ORDER");
        n.setEntityId(orderId);
        notificationRepository.save(n);

        return saved;
    }

    private User resolveVendor(CartItem cartItem) {
        if (cartItem.getProduct() != null && cartItem.getProduct().getVendor() != null) {
            return cartItem.getProduct().getVendor();
        }
        if (cartItem.getUsedListing() != null && cartItem.getUsedListing().getSeller() != null) {
            return cartItem.getUsedListing().getSeller();
        }
        return null;
    }
}
