package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.ProductImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProduct_IdOrderBySortOrder(Long productId);
}
