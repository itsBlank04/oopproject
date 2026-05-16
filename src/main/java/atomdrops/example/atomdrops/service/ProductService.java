package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Category;
import atomdrops.example.atomdrops.model.Inventory;
import atomdrops.example.atomdrops.model.Product;
import atomdrops.example.atomdrops.model.ProductImage;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.enums.ProductStatus;
import atomdrops.example.atomdrops.repository.CategoryRepository;
import atomdrops.example.atomdrops.repository.InventoryRepository;
import atomdrops.example.atomdrops.repository.ProductImageRepository;
import atomdrops.example.atomdrops.repository.ProductRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            ProductImageRepository productImageRepository,
            InventoryRepository inventoryRepository,
            UserRepository userRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productImageRepository = productImageRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<Product> findAll(Pageable pageable) {
        return productRepository.findByStatus(ProductStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Product> findByCategory(Long categoryId, Pageable pageable) {
        return productRepository.findByCategory_IdAndStatus(categoryId, ProductStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Product> findByVendor(Long vendorId, Pageable pageable) {
        return productRepository.findByVendor_Id(vendorId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Product> search(String query, Pageable pageable) {
        return productRepository.findByNameContainingIgnoreCaseAndStatus(query, ProductStatus.ACTIVE, pageable);
    }

    @Transactional(readOnly = true)
    public Product findById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    }

    public Product create(String name, String description, BigDecimal priceBdt,
                          Long categoryId, Long vendorId, List<String> imageUrls) {
        User vendor = userRepository.findById(vendorId)
            .orElseThrow(() -> new IllegalArgumentException("Vendor not found"));
        Category category = categoryRepository.findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setPriceBdt(priceBdt);
        product.setVendor(vendor);
        product.setCategory(category);
        product.setStatus(ProductStatus.ACTIVE);
        product = productRepository.save(product);

        if (imageUrls != null) {
            for (int i = 0; i < imageUrls.size(); i++) {
                ProductImage img = new ProductImage();
                img.setProduct(product);
                img.setImageUrl(imageUrls.get(i));
                img.setSortOrder(i);
                product.getImages().add(img);
                productImageRepository.save(img);
            }
        }

        Inventory inv = new Inventory();
        inv.setProduct(product);
        inv.setStockQty(0);
        inventoryRepository.save(inv);

        return product;
    }

    public Product update(Long id, String name, String description, BigDecimal priceBdt,
                          Long categoryId, ProductStatus status) {
        Product product = findById(id);
        product.setName(name);
        product.setDescription(description);
        product.setPriceBdt(priceBdt);
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));
            product.setCategory(category);
        }
        if (status != null) product.setStatus(status);
        return productRepository.save(product);
    }

    public void delete(Long id) {
        Product product = findById(id);
        product.setStatus(ProductStatus.INACTIVE);
        productRepository.save(product);
    }

    public void verifyOwner(Long productId, Long userId) {
        Product product = findById(productId);
        if (!product.getVendor().getId().equals(userId)) {
            throw new IllegalArgumentException("You do not own this product");
        }
    }
}
