package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Product;
import atomdrops.example.atomdrops.model.Review;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.repository.ProductRepository;
import atomdrops.example.atomdrops.repository.ReviewRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public ReviewService(ReviewRepository reviewRepository, UserRepository userRepository, ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    public Review createReview(Long reviewerId, Long revieweeId, Long productId, int rating, String comment) {
        User reviewer = userRepository.findById(reviewerId)
            .orElseThrow(() -> new IllegalArgumentException("Reviewer not found"));
        User reviewee = userRepository.findById(revieweeId)
            .orElseThrow(() -> new IllegalArgumentException("Reviewee not found"));
        Product product = productId != null ? productRepository.findById(productId).orElse(null) : null;
        if (rating < 1 || rating > 5) throw new IllegalArgumentException("Rating must be 1-5");
        Review r = new Review();
        r.setReviewer(reviewer);
        r.setReviewee(reviewee);
        r.setProduct(product);
        r.setRating(rating);
        r.setComment(comment);
        return reviewRepository.save(r);
    }

    @Transactional(readOnly = true)
    public List<Review> getReviewsForReviewee(Long revieweeId) {
        return reviewRepository.findByReviewee_Id(revieweeId);
    }

    @Transactional(readOnly = true)
    public List<Review> getReviewsForReviewer(Long reviewerId) {
        return reviewRepository.findByReviewer_Id(reviewerId);
    }

    @Transactional(readOnly = true)
    public List<Review> getReviewsForProduct(Long productId) {
        return reviewRepository.findByProduct_Id(productId);
    }
}
