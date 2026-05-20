package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Invoice;
import atom.example.demo.model.Notification;
import atom.example.demo.model.Order;
import atom.example.demo.model.Payment;
import atom.example.demo.model.VendorCommission;
import atom.example.demo.repository.InvoiceRepository;
import atom.example.demo.repository.NotificationRepository;
import atom.example.demo.repository.OrderRepository;
import atom.example.demo.repository.PaymentRepository;
import atom.example.demo.repository.VendorCommissionRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final VendorCommissionRepository vendorCommissionRepository;
    private final NotificationRepository notificationRepository;

    public PaymentController(PaymentRepository paymentRepository,
            OrderRepository orderRepository,
            InvoiceRepository invoiceRepository,
            VendorCommissionRepository vendorCommissionRepository,
            NotificationRepository notificationRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
        this.vendorCommissionRepository = vendorCommissionRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    @PostMapping("/order/{orderId}")
    public Map<String, Object> createPayment(@PathVariable Long orderId, @RequestBody Map<String, Object> body) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");

        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        if (!order.getCustomer().getId().equals(userId)) {
            throw new SecurityException("Not your order");
        }

        // Must be APPROVED before payment
        if (!"APPROVED".equals(order.getStatus())) {
            throw new IllegalArgumentException("Order must be approved by vendor before payment");
        }

        // Create payment
        Payment payment = new Payment();
        payment.setOrder(order);
        BigDecimal amount = order.getTotalBdt();
        if (body.containsKey("amountBdt")) {
            amount = new BigDecimal(body.get("amountBdt").toString());
        }
        payment.setAmountBdt(amount);
        payment.setMethod(body.containsKey("method") ? body.get("method").toString() : "DUMMY");
        payment.setTransactionRef(body.containsKey("transactionRef") ? body.get("transactionRef").toString() : "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        payment.setStatus("COMPLETED");
        payment.setPaidAt(Instant.now());
        payment = paymentRepository.save(payment);

        // Auto-generate invoice
        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setPayment(payment);
        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis() + "-" + orderId);
        invoice.setAmountBdt(amount);
        invoice.setStatus("PAID");
        invoice.setPaidAt(Instant.now());
        invoiceRepository.save(invoice);

        // Mark vendor commissions as PAID
        List<VendorCommission> commissions = vendorCommissionRepository.findByOrderId(orderId);
        for (VendorCommission c : commissions) {
            c.setStatus("PAID");
            vendorCommissionRepository.save(c);
        }

        // Update order status to PAID
        order.setStatus("PAID");
        orderRepository.save(order);

        // Notify vendor about payment
        for (VendorCommission c : commissions) {
            Notification n = new Notification();
            n.setUser(c.getVendor());
            n.setType("PAYMENT_RECEIVED");
            n.setTitle("Payment received for Order #" + orderId);
            n.setBody("Customer has paid ৳" + amount + " for order #" + orderId + ". Your commission has been updated.");
            n.setEntityType("ORDER");
            n.setEntityId(orderId);
            notificationRepository.save(n);
        }

        // Notify customer
        Notification cn = new Notification();
        cn.setUser(order.getCustomer());
        cn.setType("PAYMENT_CONFIRMED");
        cn.setTitle("Payment confirmed for Order #" + orderId);
        cn.setBody("Your payment of ৳" + amount + " for order #" + orderId + " has been confirmed. Invoice: " + invoice.getInvoiceNumber());
        cn.setEntityType("ORDER");
        cn.setEntityId(orderId);
        notificationRepository.save(cn);

        return Map.of(
            "paymentId", payment.getId(),
            "invoiceNumber", invoice.getInvoiceNumber(),
            "status", "COMPLETED",
            "amountBdt", amount
        );
    }

    @GetMapping("/order/{orderId}")
    public Map<String, Object> getPaymentInfo(@PathVariable Long orderId) {
        List<Payment> payments = paymentRepository.findByOrderId(orderId);
        List<Invoice> invoices = invoiceRepository.findByOrderId(orderId);
        Payment payment = payments.isEmpty() ? null : payments.get(0);
        Invoice invoice = invoices.isEmpty() ? null : invoices.get(0);
        return Map.of(
            "payment", payment,
            "invoice", invoice
        );
    }
}
