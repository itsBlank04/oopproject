package atom.example.demo.repository;

import atom.example.demo.model.Shop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopRepository extends JpaRepository<Shop, Long> {
    List<Shop> findByVendorId(Long vendorId);
    Optional<Shop> findBySlug(String slug);
    Optional<Shop> findByName(String name);
    long countByVendorId(Long vendorId);
}
