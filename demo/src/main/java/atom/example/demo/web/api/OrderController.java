package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Order;
import atom.example.demo.repository.OrderRepository;
import atom.example.demo.service.OrderService;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final OrderRepository orderRepository;

    public OrderController(OrderService orderService, OrderRepository orderRepository) {
        this.orderService = orderService;
        this.orderRepository = orderRepository;
    }

    @PostMapping
    public Order checkout(@RequestBody Map<String, Object> body, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Long addressId = Long.valueOf(body.get("shippingAddressId").toString());
        String couponCode = body.containsKey("couponCode") ? (String) body.get("couponCode") : null;
        String shippingOption = body.containsKey("shippingOption") ? (String) body.get("shippingOption") : null;
        return orderService.checkout(userId, addressId, couponCode, shippingOption);
    }

    @GetMapping
    public List<Order> listOrders(HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return orderRepository.findByCustomerIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/{id}")
    public Order getOrder(@PathVariable Long id, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        List<Order> orders = orderRepository.findByIdAndCustomerId(id, userId);
        if (orders.isEmpty()) throw new IllegalArgumentException("Order not found");
        return orders.get(0);
    }

    @PutMapping("/{id}/cancel")
    public Order cancelOrder(@PathVariable Long id, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return orderService.cancelOrder(id, userId);
    }
}
