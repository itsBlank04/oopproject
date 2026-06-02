package atom.example.demo.service;

import atom.example.demo.model.Invoice;
import atom.example.demo.model.Notification;
import atom.example.demo.model.Order;
import atom.example.demo.model.Payment;
import atom.example.demo.model.VendorCommission;
import atom.example.demo.model.OrderStatusLog;
import atom.example.demo.repository.InvoiceRepository;
import atom.example.demo.repository.NotificationRepository;
import atom.example.demo.repository.OrderRepository;
import atom.example.demo.repository.OrderStatusLogRepository;
import atom.example.demo.repository.PaymentRepository;
import atom.example.demo.repository.VendorCommissionRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;
    private final VendorCommissionRepository vendorCommissionRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final OrderStatusLogRepository orderStatusLogRepository;

    public PaymentService(PaymentRepository paymentRepository,
                          OrderRepository orderRepository,
                          InvoiceRepository invoiceRepository,
                          VendorCommissionRepository vendorCommissionRepository,
                          NotificationRepository notificationRepository,
                          EmailService emailService,
                          OrderStatusLogRepository orderStatusLogRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
        this.vendorCommissionRepository = vendorCommissionRepository;
        this.notificationRepository = notificationRepository;
        this.emailService = emailService;
        this.orderStatusLogRepository = orderStatusLogRepository;
    }

    @Transactional
    public Map<String, Object> processPayment(Order order, String method, BigDecimal amount) {
        boolean isCod = "COD".equalsIgnoreCase(method);
        boolean isOnline = !isCod && List.of("BKASH", "NAGAD", "CARD").contains(method.toUpperCase());

        String status = isCod ? "PENDING" : "PAID";

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmountBdt(amount);
        payment.setMethod(method.toUpperCase());
        payment.setTransactionRef(generateTxnRef(method));
        payment.setStatus(status);
        payment.setPaidAt(isOnline ? Instant.now() : null);

        if (isOnline) {
            payment.setGatewayName(method.toUpperCase());
            payment.setGatewayResponse("{\"simulated\":true,\"status\":\"success\"}");
        }

        payment = paymentRepository.save(payment);

        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setPayment(payment);
        invoice.setInvoiceNumber(generateInvoiceNumber(order.getId()));
        invoice.setAmountBdt(amount);
        invoice.setStatus(isCod ? "UNPAID" : "PAID");
        invoice.setPaidAt(isOnline ? Instant.now() : null);
        invoiceRepository.save(invoice);

        if (isOnline) {
            List<VendorCommission> commissions = vendorCommissionRepository.findByOrderId(order.getId());
            for (VendorCommission c : commissions) {
                c.setStatus("PAID");
                vendorCommissionRepository.save(c);
            }
            notifyVendorsPayment(order, amount, commissions);
            notifyCustomer(order, amount, invoice, method);

            Notification cn = new Notification();
            cn.setUser(order.getCustomer());
            cn.setType("PAYMENT_CONFIRMED");
            cn.setTitle("Payment confirmed for Order #" + order.getId());
            cn.setBody("Your " + method + " payment of ৳" + amount + " for order #" + order.getId() + " confirmed. Invoice: " + invoice.getInvoiceNumber());
            cn.setEntityType("ORDER");
            cn.setEntityId(order.getId());
            notificationRepository.save(cn);

            order.setStatus("APPROVED");
            orderRepository.save(order);

            OrderStatusLog statusLog = new OrderStatusLog();
            statusLog.setOrder(order);
            statusLog.setOldStatus("PLACED");
            statusLog.setNewStatus("APPROVED");
            statusLog.setNote("Payment confirmed — order automatically approved");
            statusLog.setChangedAt(Instant.now());
            orderStatusLogRepository.save(statusLog);
        } else {
            for (VendorCommission c : vendorCommissionRepository.findByOrderId(order.getId())) {
                Notification n = new Notification();
                n.setUser(c.getVendor());
                n.setType("COD_ORDER");
                n.setTitle("COD Order #" + order.getId());
                n.setBody("Customer selected Cash on Delivery for order #" + order.getId() + ". Please process the order. Payment will be collected on delivery.");
                n.setEntityType("ORDER");
                n.setEntityId(order.getId());
                notificationRepository.save(n);
            }

            Notification cn = new Notification();
            cn.setUser(order.getCustomer());
            cn.setType("ORDER_CONFIRMED_COD");
            cn.setTitle("Order #" + order.getId() + " confirmed (Cash on Delivery)");
            cn.setBody("Your order #" + order.getId() + " has been placed with Cash on Delivery. Pay ৳" + amount + " when you receive your items.");
            cn.setEntityType("ORDER");
            cn.setEntityId(order.getId());
            notificationRepository.save(cn);
        }

        emailService.sendInvoiceEmail(order.getCustomer(), order, invoice, method.toUpperCase());
        emailService.sendOrderConfirmation(order.getCustomer(), order, method.toUpperCase(), invoice.getInvoiceNumber());

        return Map.of(
            "paymentId", payment.getId(),
            "invoiceNumber", invoice.getInvoiceNumber(),
            "status", status,
            "amountBdt", amount,
            "method", method.toUpperCase()
        );
    }

    private void notifyVendorsPayment(Order order, BigDecimal amount, List<VendorCommission> commissions) {
        for (VendorCommission c : commissions) {
            Notification n = new Notification();
            n.setUser(c.getVendor());
            n.setType("PAYMENT_RECEIVED");
            n.setTitle("Payment received for Order #" + order.getId());
            n.setBody("Customer has paid ৳" + amount + " for order #" + order.getId() + ". Your commission has been updated.");
            n.setEntityType("ORDER");
            n.setEntityId(order.getId());
            notificationRepository.save(n);
        }
    }

    private void notifyCustomer(Order order, BigDecimal amount, Invoice invoice, String method) {
        Notification cn = new Notification();
        cn.setUser(order.getCustomer());
        cn.setType("PAYMENT_CONFIRMED");
        cn.setTitle("Payment confirmed for Order #" + order.getId());
        cn.setBody("Your " + method + " payment of ৳" + amount + " for order #" + order.getId() + " has been confirmed. Invoice: " + invoice.getInvoiceNumber());
        cn.setEntityType("ORDER");
        cn.setEntityId(order.getId());
        notificationRepository.save(cn);
    }

    private String generateTxnRef(String method) {
        String prefix = switch (method.toUpperCase()) {
            case "BKASH" -> "BKS";
            case "NAGAD" -> "NGD";
            case "CARD" -> "CRD";
            default -> "TXN";
        };
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
    }

    private String generateInvoiceNumber(Long orderId) {
        return "INV-" + System.currentTimeMillis() + "-" + orderId;
    }
}
