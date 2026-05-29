package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Invoice;
import atom.example.demo.model.Order;
import atom.example.demo.model.Payment;
import atom.example.demo.repository.InvoiceRepository;
import atom.example.demo.repository.OrderRepository;
import atom.example.demo.repository.PaymentRepository;
import atom.example.demo.service.PaymentService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final InvoiceRepository invoiceRepository;

    public PaymentController(PaymentService paymentService,
                             PaymentRepository paymentRepository,
                             OrderRepository orderRepository,
                             InvoiceRepository invoiceRepository) {
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.invoiceRepository = invoiceRepository;
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

        if (!"APPROVED".equals(order.getStatus())) {
            throw new IllegalArgumentException("Order must be approved by vendor before payment");
        }

        String method = body.containsKey("method") ? body.get("method").toString() : "BKASH";
        BigDecimal amount = order.getTotalBdt();
        if (body.containsKey("amountBdt")) {
            amount = new BigDecimal(body.get("amountBdt").toString());
        }

        return paymentService.processPayment(order, method, amount);
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

    @GetMapping("/invoice/{orderId}/download")
    public ResponseEntity<String> invoiceAction(
            @PathVariable Long orderId,
            @RequestParam(defaultValue = "true") boolean download) {
        return buildInvoiceResponse(orderId, download);
    }

    private ResponseEntity<String> buildInvoiceResponse(Long orderId, boolean asAttachment) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");

        List<Invoice> invoices = invoiceRepository.findByOrderId(orderId);
        if (invoices.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Invoice invoice = invoices.get(0);

        if (!invoice.getOrder().getCustomer().getId().equals(userId)) {
            throw new SecurityException("Not your invoice");
        }

        String html = buildInvoiceHtml(invoice);
        var response = ResponseEntity.ok().contentType(MediaType.TEXT_HTML);
        if (asAttachment) {
            response = response.header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + invoice.getInvoiceNumber() + ".html\"");
        }
        return response.body(html);
    }

    private String buildInvoiceHtml(Invoice invoice) {
        var order = invoice.getOrder();
        var fmt = java.text.NumberFormat.getNumberInstance(new java.util.Locale("en", "BD"));
        fmt.setMinimumFractionDigits(2);

        String paymentMethod = invoice.getPayment() != null ? invoice.getPayment().getMethod() : "—";

        var itemsHtml = new StringBuilder();
        for (var item : order.getItems()) {
            String name = item.getProduct() != null ? item.getProduct().getName() : "Item #" + item.getId();
            var lineTotal = item.getUnitPriceBdt().multiply(java.math.BigDecimal.valueOf(item.getQty()));
            itemsHtml.append("<tr><td style=\"padding:8px 12px;border-bottom:1px solid #e0d6cc\">").append(name).append("</td>")
                .append("<td style=\"padding:8px 12px;border-bottom:1px solid #e0d6cc;text-align:center\">").append(item.getQty()).append("</td>")
                .append("<td style=\"padding:8px 12px;border-bottom:1px solid #e0d6cc;text-align:right\">৳").append(fmt.format(item.getUnitPriceBdt())).append("</td>")
                .append("<td style=\"padding:8px 12px;border-bottom:1px solid #e0d6cc;text-align:right\">৳").append(fmt.format(lineTotal)).append("</td></tr>");
        }

        String discountRow = order.getDiscountBdt().compareTo(java.math.BigDecimal.ZERO) > 0
            ? "<tr><td colspan=\"3\" style=\"text-align:right;padding:4px 12px;color:#059669\">Discount:</td><td style=\"text-align:right;padding:4px 12px;color:#059669\">-৳" + fmt.format(order.getDiscountBdt()) + "</td></tr>"
            : "";

        String statusBadge = "PAID".equals(invoice.getStatus())
            ? "<span style=\"background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600\">Paid</span>"
            : "<span style=\"background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600\">Unpaid</span>";

        var dtf = java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")
            .withZone(java.time.ZoneId.of("Asia/Dhaka"));

        return """
            <!DOCTYPE html>
            <html><head><meta charset="UTF-8"><title>Invoice %s</title>
            <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:0;background:#f5f0eb}
            table{width:100%%;border-collapse:collapse}th{background:#f5f0eb;padding:10px 12px;text-align:left;font-size:12px;color:#6c5b4f;text-transform:uppercase}
            .total{font-size:18px;font-weight:700}</style></head>
            <body style="margin:0;padding:30px 16px;background:#f5f0eb">
            <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
              <div style="background:#1a1512;padding:24px 32px;text-align:center">
                <h1 style="color:#faf6f2;margin:0;font-size:20px;font-weight:700">INVOICE</h1>
                <p style="color:#b8a494;margin:4px 0 0;font-size:13px">%s</p>
              </div>
              <div style="padding:28px 32px">
                <table><tr>
                  <td style="font-size:13px;color:#6c5b4f;vertical-align:top">
                    <strong style="color:#1a1512;display:block;margin-bottom:4px">Bill To</strong>
                    %s<br>%s
                  </td>
                  <td style="font-size:13px;color:#6c5b4f;text-align:right;vertical-align:top">
                    <strong style="color:#1a1512;display:block;margin-bottom:4px">Invoice #</strong>%s<br>
                    <strong style="color:#1a1512;display:block;margin-top:8px;margin-bottom:4px">Date</strong>%s<br>
                    <strong style="color:#1a1512;display:block;margin-top:8px;margin-bottom:4px">Payment</strong>%s
                  </td>
                </tr></table>
                <div style="margin-top:8px;text-align:right">%s</div>
              </div>
              <div style="padding:0 32px">
                <table>
                  <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
                  %s
                </table>
              </div>
              <div style="padding:16px 32px 28px">
                <table><tr><td style="text-align:right;font-size:13px;color:#6c5b4f;padding:3px 0">
                  Subtotal: <strong style="color:#1a1512;width:100px;display:inline-block;text-align:right">৳%s</strong>
                </td></tr>
                %s
                <tr><td style="text-align:right;font-size:13px;color:#6c5b4f;padding:3px 0">
                  Shipping: <strong style="color:#1a1512;width:100px;display:inline-block;text-align:right">৳%s</strong>
                </td></tr>
                <tr><td style="text-align:right;font-size:16px;font-weight:700;color:#1a1512;padding:8px 0 0;border-top:2px solid #1a1512;margin-top:6px">
                  Total: <strong style="width:100px;display:inline-block;text-align:right">৳%s</strong>
                </td></tr></table>
              </div>
              <div style="background:#f5f0eb;padding:16px 32px;text-align:center;font-size:12px;color:#8c7564">
                Thank you for your purchase!
              </div>
            </div>
            </body></html>
            """.formatted(
                invoice.getInvoiceNumber(),
                invoice.getInvoiceNumber(),
                order.getCustomer().getDisplayName(),
                order.getCustomer().getEmail(),
                invoice.getInvoiceNumber(),
                invoice.getGeneratedAt() != null ? dtf.format(invoice.getGeneratedAt()) : "—",
                paymentMethod,
                statusBadge,
                itemsHtml,
                fmt.format(order.getSubtotalBdt()),
                discountRow,
                fmt.format(order.getShippingFeeBdt()),
                fmt.format(order.getTotalBdt())
            );
    }
}
