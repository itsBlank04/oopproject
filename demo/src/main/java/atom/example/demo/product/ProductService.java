package atom.example.demo.product;

import atom.example.demo.model.Product;
import atom.example.demo.model.ProductImage;
import atom.example.demo.repository.ProductRepository;
import java.math.BigDecimal;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Page<Product> getActiveProducts(Pageable pageable) {
        return productRepository.findByStatus("ACTIVE", pageable);
    }

    public Product getProduct(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }

    public Page<Product> searchProducts(String search, Long category, BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        return productRepository.searchProducts(search, category, minPrice, maxPrice, pageable);
    }

    @Transactional
    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, Product updated) {
        Product existing = getProduct(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getPriceBdt() != null) existing.setPriceBdt(updated.getPriceBdt());
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getStatus() != null) existing.setStatus(updated.getStatus());
        return productRepository.save(existing);
    }

    @Transactional
    public void softDeleteProduct(Long id) {
        Product product = getProduct(id);
        product.setDeletedAt(Instant.now());
        productRepository.save(product);
    }

    @Transactional
    public Product addProductImage(Long productId, String imageUrl) {
        Product product = getProduct(productId);
        ProductImage img = new ProductImage();
        img.setProduct(product);
        img.setImageUrl(imageUrl);
        img.setSortOrder(product.getImages().size());
        product.getImages().add(img);
        return productRepository.save(product);
    }
}
