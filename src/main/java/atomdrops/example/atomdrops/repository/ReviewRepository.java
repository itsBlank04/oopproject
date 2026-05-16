package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByReviewee_Id(Long revieweeId);
    List<Review> findByReviewer_Id(Long reviewerId);
    List<Review> findByProduct_Id(Long productId);
}
