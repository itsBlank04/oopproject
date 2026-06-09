package atom.example.demo.repository;

import atom.example.demo.model.Product;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByVendorId(Long vendorId);
    long countByVendorId(Long vendorId);
    List<Product> findByShopId(Long shopId);
    long countByShopId(Long shopId);
    Page<Product> findByStatus(String status, Pageable pageable);

    @Query(value = "SELECT * FROM products p WHERE p.deleted_at IS NULL AND p.status = 'ACTIVE' "
        + "AND (:search IS NULL OR LOWER(p.name::text) LIKE LOWER(CONCAT('%', :search, '%'))) "
        + "AND (:category IS NULL OR p.category_id = :category) "
        + "AND (:minPrice IS NULL OR p.price_bdt >= :minPrice) "
        + "AND (:maxPrice IS NULL OR p.price_bdt <= :maxPrice) "
        + "ORDER BY p.created_at DESC",
        countQuery = "SELECT count(*) FROM products p WHERE p.deleted_at IS NULL AND p.status = 'ACTIVE' "
        + "AND (:search IS NULL OR LOWER(p.name::text) LIKE LOWER(CONCAT('%', :search, '%'))) "
        + "AND (:category IS NULL OR p.category_id = :category) "
        + "AND (:minPrice IS NULL OR p.price_bdt >= :minPrice) "
        + "AND (:maxPrice IS NULL OR p.price_bdt <= :maxPrice)",
        nativeQuery = true)
    Page<Product> searchProducts(@Param("search") String search,
        @Param("category") Long category,
        @Param("minPrice") BigDecimal minPrice,
        @Param("maxPrice") BigDecimal maxPrice,
        Pageable pageable);
}
