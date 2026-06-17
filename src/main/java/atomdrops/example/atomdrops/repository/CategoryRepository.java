package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Category;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByParent_Id(Long parentId);
}
