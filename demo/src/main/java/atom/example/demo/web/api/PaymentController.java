package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Order;
import atom.example.demo.model.Payment;
import atom.example.demo.repository.OrderRepository;
import atom.example.demo.repository.PaymentRepository;
import java.util.List;
import java.util.Map;
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

    public PaymentController(PaymentRepository paymentRepository, OrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    @PostMapping("/order/{orderId}")
    public Payment createPayment(@PathVariable Long orderId, @RequestBody Map<String, Object> body) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new IllegalArgumentException("Order not found"));
        Payment payment = new Payment();
        payment.setOrder(order);
        if (body.containsKey("amountBdt")) {
            payment.setAmountBdt(new java.math.BigDecimal(body.get("amountBdt").toString()));
        }
        if (body.containsKey("method")) {
            payment.setMethod(body.get("method").toString());
        }
        if (body.containsKey("transactionRef")) {
            payment.setTransactionRef(body.get("transactionRef").toString());
        }
        return paymentRepository.save(payment);
    }

    @GetMapping("/order/{orderId}")
    public List<Payment> getPaymentsForOrder(@PathVariable Long orderId) {
        return paymentRepository.findByOrderId(orderId);
    }
}
