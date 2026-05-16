package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Inventory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProduct_Id(Long productId);
    @EntityGraph(attributePaths = {"product"})
    List<Inventory> findAll();
}
