package atom.example.demo.service;

import atom.example.demo.model.Invoice;
import atom.example.demo.model.Order;
import atom.example.demo.model.OrderItem;
import atom.example.demo.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")
            .withZone(ZoneId.of("Asia/Dhaka"));

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOrderConfirmation(User customer, Order order, String paymentMethod, String invoiceNumber) {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.info("Mail not configured — skipping order confirmation for order #{}", order.getId());
            return;
        }

        try {
            var mime = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(customer.getEmail());
            helper.setSubject("Order #" + order.getId() + " Confirmed — Thank you!");

            String html = buildConfirmationHtml(customer, order, paymentMethod, invoiceNumber);
            helper.setText(html, true);

            mailSender.send(mime);
            log.info("Order confirmation sent to {} for order #{}", customer.getEmail(), order.getId());
        } catch (Exception e) {
            log.warn("Failed to send order confirmation for order #{}: {}", order.getId(), e.getMessage());
        }
    }

    public void sendInvoiceEmail(User customer, Order order, Invoice invoice, String paymentMethod) {
        if (fromEmail == null || fromEmail.isBlank()) {
            log.info("Mail not configured — skipping invoice email for order #{}", order.getId());
            return;
        }

        try {
            var mime = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(customer.getEmail());
            helper.setSubject("Invoice " + invoice.getInvoiceNumber() + " — Your Order #" + order.getId());

            String html = buildInvoiceHtml(customer, order, invoice, paymentMethod);
            helper.setText(html, true);

            mailSender.send(mime);
            log.info("Invoice email sent to {} for order #{}", customer.getEmail(), order.getId());
        } catch (Exception e) {
            log.warn("Failed to send invoice email for order #{}: {}", order.getId(), e.getMessage());
        }
    }

    private String buildInvoiceHtml(User customer, Order order, Invoice invoice, String paymentMethod) {
        var fmt = NumberFormat.getNumberInstance(new Locale("en", "BD"));
        fmt.setMinimumFractionDigits(2);
        fmt.setMaximumFractionDigits(2);

        StringBuilder itemsHtml = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            String name = item.getProduct() != null ? item.getProduct().getName() : "Item #" + item.getId();
            BigDecimal lineTotal = item.getUnitPriceBdt().multiply(BigDecimal.valueOf(item.getQty()));
            itemsHtml.append("""
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0d6cc;font-size:14px">%s</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0d6cc;font-size:14px;text-align:center">%d</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0d6cc;font-size:14px;text-align:right">৳%s</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0d6cc;font-size:14px;text-align:right">৳%s</td>
                </tr>
                """.formatted(name, item.getQty(), fmt.format(item.getUnitPriceBdt()), fmt.format(lineTotal)));
        }

        String paidBadge = "PAID".equals(invoice.getStatus())
            ? "<span style=\"background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600\">Paid</span>"
            : "<span style=\"background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600\">Pending</span>";

        String paidAtStr = invoice.getPaidAt() != null
            ? DT_FMT.format(invoice.getPaidAt())
            : "—";

        return """
            <!DOCTYPE html>
            <html><body style="margin:0;padding:0;background:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
            <table width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 16px">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
                <tr><td style="background:#1a1512;padding:24px 32px;text-align:center">
                  <h1 style="color:#faf6f2;margin:0;font-size:20px;font-weight:700;letter-spacing:-0.3px">INVOICE</h1>
                  <p style="color:#b8a494;margin:4px 0 0;font-size:13px">%s</p>
                </td></tr>
                <tr><td style="padding:28px 32px">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#6c5b4f;vertical-align:top">
                        <strong style="color:#1a1512;display:block;margin-bottom:4px">Bill To</strong>
                        %s<br>
                        %s
                      </td>
                      <td style="font-size:13px;color:#6c5b4f;text-align:right;vertical-align:top">
                        <strong style="color:#1a1512;display:block;margin-bottom:4px">Invoice #</strong>
                        %s<br>
                        <strong style="color:#1a1512;display:block;margin-top:8px;margin-bottom:4px">Date</strong>
                        %s<br>
                        <strong style="color:#1a1512;display:block;margin-top:8px;margin-bottom:4px">Payment</strong>
                        %s
                      </td>
                    </tr>
                  </table>
                  <div style="margin-top:8px">%s</div>
                </td></tr>
                <tr><td style="padding:0 32px">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr style="background:#f5f0eb">
                      <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6c5b4f;text-transform:uppercase">Item</th>
                      <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#6c5b4f;text-transform:uppercase">Qty</th>
                      <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#6c5b4f;text-transform:uppercase">Price</th>
                      <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#6c5b4f;text-transform:uppercase">Total</th>
                    </tr>
                    %s
                  </table>
                </td></tr>
                <tr><td style="padding:16px 32px 28px">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr><td style="text-align:right;font-size:13px;color:#6c5b4f;padding:3px 0">
                      Subtotal: <strong style="color:#1a1512;width:100px;display:inline-block;text-align:right">৳%s</strong>
                    </td></tr>
                    %s
                    %s
                    <tr><td style="text-align:right;font-size:16px;font-weight:700;color:#1a1512;padding:8px 0 0;border-top:2px solid #1a1512;margin-top:6px">
                      Total: <strong style="width:100px;display:inline-block;text-align:right">৳%s</strong>
                    </td></tr>
                  </table>
                </td></tr>
                <tr><td style="background:#f5f0eb;padding:16px 32px;text-align:center;font-size:12px;color:#8c7564">
                  Thank you for your purchase!<br>
                  <a href="%s/account/orders" style="color:#1a1512;text-decoration:underline">View your orders</a>
                </td></tr>
              </table>
            </td></tr></table>
            </body></html>
            """.formatted(
                invoice.getInvoiceNumber(),
                customer.getDisplayName(),
                customer.getEmail(),
                invoice.getInvoiceNumber(),
                DT_FMT.format(invoice.getGeneratedAt()),
                paymentMethod,
                paidBadge,
                itemsHtml,
                fmt.format(order.getSubtotalBdt()),
                order.getDiscountBdt().compareTo(BigDecimal.ZERO) > 0
                    ? "<tr><td style=\"text-align:right;font-size:13px;color:#059669;padding:3px 0\">Discount: <strong style=\"color:#059669;width:100px;display:inline-block;text-align:right\">-৳%s</strong></td></tr>".formatted(fmt.format(order.getDiscountBdt()))
                    : "",
                "<tr><td style=\"text-align:right;font-size:13px;color:#6c5b4f;padding:3px 0\">Shipping: <strong style=\"color:#1a1512;width:100px;display:inline-block;text-align:right\">৳%s</strong></td></tr>".formatted(fmt.format(order.getShippingFeeBdt())),
                fmt.format(order.getTotalBdt()),
                baseUrl
            );
    }

    private String deliveryEstimate(Order order) {
        if (order.getShippingOption() == null) return "3\u20137 business days";
        return switch (order.getShippingOption()) {
            case "INSIDE_DHAKA" -> "1\u20133 business days";
            case "OUTSIDE_DHAKA" -> "3\u20137 business days";
            default -> "3\u20137 business days";
        };
    }

    private String buildConfirmationHtml(User customer, Order order, String paymentMethod, String invoiceNumber) {
        var fmt = NumberFormat.getNumberInstance(new Locale("en", "BD"));
        fmt.setMinimumFractionDigits(2);
        fmt.setMaximumFractionDigits(2);

        StringBuilder itemsHtml = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            String name = item.getProduct() != null ? item.getProduct().getName() : "Item #" + item.getId();
            BigDecimal lineTotal = item.getUnitPriceBdt().multiply(BigDecimal.valueOf(item.getQty()));
            itemsHtml.append("""
                <tr>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0d6cc;font-size:14px">%s</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0d6cc;font-size:14px;text-align:center">%d</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0d6cc;font-size:14px;text-align:right">\u09f3%s</td>
                  <td style="padding:10px 12px;border-bottom:1px solid #e0d6cc;font-size:14px;text-align:right">\u09f3%s</td>
                </tr>
                """.formatted(name, item.getQty(), fmt.format(item.getUnitPriceBdt()), fmt.format(lineTotal)));
        }

        String discountRow = order.getDiscountBdt().compareTo(BigDecimal.ZERO) > 0
            ? "<tr><td style=\"text-align:right;font-size:13px;color:#059669;padding:3px 0\">Discount: <strong style=\"color:#059669;width:100px;display:inline-block;text-align:right\">-\u09f3%s</strong></td></tr>".formatted(fmt.format(order.getDiscountBdt()))
            : "";

        String shippingRow = order.getShippingFeeBdt().compareTo(BigDecimal.ZERO) == 0
            ? "<tr><td style=\"text-align:right;font-size:13px;color:#059669;padding:3px 0\">Shipping: <strong style=\"color:#059669;width:100px;display:inline-block;text-align:right\">Free</strong></td></tr>"
            : "<tr><td style=\"text-align:right;font-size:13px;color:#6c5b4f;padding:3px 0\">Shipping: <strong style=\"color:#1a1512;width:100px;display:inline-block;text-align:right\">\u09f3%s</strong></td></tr>".formatted(fmt.format(order.getShippingFeeBdt()));

        String delivery = deliveryEstimate(order);

        return """
            <!DOCTYPE html>
            <html><body style="margin:0;padding:0;background:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
            <table width="100%%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:30px 16px">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06)">
                <tr><td style="background:#1a1512;padding:32px;text-align:center">
                  <div style="background:#059669;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
                  </div>
                  <h1 style="color:#faf6f2;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.3px">Order Confirmed!</h1>
                  <p style="color:#b8a494;margin:8px 0 0;font-size:14px">Order #%d</p>
                </td></tr>
                <tr><td style="padding:28px 32px">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:13px;color:#6c5b4f;vertical-align:top">
                        <strong style="color:#1a1512;display:block;margin-bottom:4px">Customer</strong>
                        %s<br>%s
                      </td>
                      <td style="font-size:13px;color:#6c5b4f;text-align:right;vertical-align:top">
                        <strong style="color:#1a1512;display:block;margin-bottom:4px">Payment</strong>
                        %s<br>
                        <strong style="color:#1a1512;display:block;margin-top:8px;margin-bottom:4px">Invoice</strong>
                        %s
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0 32px">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr style="background:#f5f0eb">
                      <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#6c5b4f;text-transform:uppercase">Item</th>
                      <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;color:#6c5b4f;text-transform:uppercase">Qty</th>
                      <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#6c5b4f;text-transform:uppercase">Price</th>
                      <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#6c5b4f;text-transform:uppercase">Total</th>
                    </tr>
                    %s
                  </table>
                </td></tr>
                <tr><td style="padding:16px 32px 28px">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr><td style="text-align:right;font-size:13px;color:#6c5b4f;padding:3px 0">
                      Subtotal: <strong style="color:#1a1512;width:100px;display:inline-block;text-align:right">\u09f3%s</strong>
                    </td></tr>
                    %s
                    %s
                    <tr><td style="text-align:right;font-size:16px;font-weight:700;color:#1a1512;padding:8px 0 0;border-top:2px solid #1a1512;margin-top:6px">
                      Total: <strong style="width:100px;display:inline-block;text-align:right">\u09f3%s</strong>
                    </td></tr>
                  </table>
                </td></tr>
                <tr><td style="background:#eff6ff;padding:20px 32px;border-top:1px solid #bfdbfe">
                  <table width="100%%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:top">
                        <p style="margin:0;font-size:13px;font-weight:600;color:#1e40af">Delivery Estimate</p>
                        <p style="margin:4px 0 0;font-size:13px;color:#3b82f6">Expected within <strong>%s</strong></p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="background:#f5f0eb;padding:20px 32px;text-align:center;font-size:13px;color:#8c7564">
                  <a href="%s/account/orders" style="display:inline-block;background:#1a1512;color:#faf6f2;padding:10px 24px;border-radius:12px;font-size:13px;font-weight:600;text-decoration:none">Track Your Order</a>
                  <p style="margin:12px 0 0;font-size:12px">Thank you for shopping with us!</p>
                </td></tr>
              </table>
            </td></tr></table>
            </body></html>
            """.formatted(
                order.getId(),
                customer.getDisplayName(),
                customer.getEmail(),
                paymentMethod,
                invoiceNumber,
                itemsHtml,
                fmt.format(order.getSubtotalBdt()),
                discountRow,
                shippingRow,
                fmt.format(order.getTotalBdt()),
                delivery,
                baseUrl
            );
    }
}
