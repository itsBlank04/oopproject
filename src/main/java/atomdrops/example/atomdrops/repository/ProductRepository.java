package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Product;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByVendor_Id(Long vendorId);
    List<Product> findByCategory_Id(Long categoryId);
}
