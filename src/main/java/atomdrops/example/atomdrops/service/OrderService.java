package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Inventory;
import atomdrops.example.atomdrops.model.Order;
import atomdrops.example.atomdrops.model.OrderItem;
import atomdrops.example.atomdrops.model.Payment;
import atomdrops.example.atomdrops.model.Product;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.enums.OrderStatus;
import atomdrops.example.atomdrops.model.enums.PaymentStatus;
import atomdrops.example.atomdrops.repository.InventoryRepository;
import atomdrops.example.atomdrops.repository.OrderRepository;
import atomdrops.example.atomdrops.repository.PaymentRepository;
import atomdrops.example.atomdrops.repository.ProductRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository,
            PaymentRepository paymentRepository,
            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
    }

    public static class CreateOrderItem {
        private Long productId;
        private int qty;

        public CreateOrderItem() {}
        public CreateOrderItem(Long productId, int qty) {
            this.productId = productId;
            this.qty = qty;
        }
        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }
        public int getQty() { return qty; }
        public void setQty(int qty) { this.qty = qty; }
    }

    public Order createOrder(Long customerId, List<CreateOrderItem> items) {
        User customer = userRepository.findById(customerId)
            .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        Order order = new Order();
        order.setCustomer(customer);

        BigDecimal total = BigDecimal.ZERO;

        for (CreateOrderItem item : items) {
            Product product = productRepository.findById(item.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + item.getProductId()));

            Inventory inv = inventoryRepository.findByProduct_Id(item.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not available: " + item.getProductId()));

            if (inv.getStockQty() < item.getQty()) {
                throw new IllegalArgumentException("Insufficient stock for: " + product.getName());
            }

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(product);
            oi.setQty(item.getQty());
            oi.setUnitPriceBdt(product.getPriceBdt());
            order.getItems().add(oi);

            total = total.add(product.getPriceBdt().multiply(BigDecimal.valueOf(item.getQty())));
        }

        order.setTotalBdt(total);
        order = orderRepository.save(order);

        for (OrderItem oi : order.getItems()) {
            Inventory inv = inventoryRepository.findByProduct_Id(oi.getProduct().getId()).orElseThrow(() -> new IllegalArgumentException("Inventory not found for product: " + oi.getProduct().getId()));
            inv.setStockQty(inv.getStockQty() - oi.getQty());
            inventoryRepository.save(inv);
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmountBdt(total);
        payment.setMethod("DUMMY");
        payment.setTransactionRef("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);

        order.setStatus(OrderStatus.PAID);
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public Page<Order> findByCustomer(Long customerId, Pageable pageable) {
        return orderRepository.findByCustomer_Id(customerId, pageable);
    }

    @Transactional(readOnly = true)
    public Order findById(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
    }

    @Transactional(readOnly = true)
    public Order findByIdAndVerifyOwner(Long id, Long userId) {
        Order order = findById(id);
        if (!order.getCustomer().getId().equals(userId)) {
            throw new IllegalArgumentException("Not authorized");
        }
        return order;
    }
}
