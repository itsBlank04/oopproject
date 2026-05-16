package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Product;
import atomdrops.example.atomdrops.model.enums.ProductStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    @EntityGraph(attributePaths = {"category", "vendor", "images"})
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "vendor", "images"})
    Page<Product> findByCategory_IdAndStatus(Long categoryId, ProductStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "vendor", "images"})
    Page<Product> findByVendor_Id(Long vendorId, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "vendor", "images"})
    Page<Product> findByNameContainingIgnoreCaseAndStatus(String name, ProductStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "vendor", "images"})
    Optional<Product> findById(Long id);

    List<Product> findByVendor_Id(Long vendorId);
    List<Product> findByCategory_Id(Long categoryId);
}
