package atom.example.demo.repository;

import atom.example.demo.model.Invoice;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByOrderId(Long orderId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
}
