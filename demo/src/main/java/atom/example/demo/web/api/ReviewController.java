package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Product;
import atom.example.demo.model.Review;
import atom.example.demo.model.User;
import atom.example.demo.repository.ProductRepository;
import atom.example.demo.repository.ReviewRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public ReviewController(ReviewRepository reviewRepository, UserRepository userRepository,
            ProductRepository productRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @PostMapping("/reviews")
    public Review createReview(@RequestBody Map<String, Object> body, HttpSession session) {
        if (!SecurityConfig.hasRole("CUSTOMER")) throw new SecurityException("Customer access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) {
            throw new IllegalArgumentException("Not authenticated");
        }
        User reviewer = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Review review = new Review();
        review.setReviewer(reviewer);
        if (body.containsKey("revieweeId")) {
            User reviewee = userRepository.findById(Long.valueOf(body.get("revieweeId").toString()))
                .orElseThrow(() -> new IllegalArgumentException("Reviewee not found"));
            if (reviewee.getId().equals(userId)) {
                throw new IllegalArgumentException("You cannot review yourself");
            }
            review.setReviewee(reviewee);
        }
        if (body.containsKey("productId")) {
            Product product = productRepository.findById(Long.valueOf(body.get("productId").toString()))
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
            if (product.getVendor() != null && product.getVendor().getId().equals(userId)) {
                throw new IllegalArgumentException("You cannot review your own product");
            }
            review.setProduct(product);
            if (body.get("revieweeId") == null && product.getVendor() != null) {
                review.setReviewee(product.getVendor());
            }
        }
        if (body.containsKey("rating")) {
            review.setRating(Integer.parseInt(body.get("rating").toString()));
        }
        if (body.containsKey("comment")) {
            review.setComment(body.get("comment").toString());
        }
        return reviewRepository.save(review);
    }

    @GetMapping("/users/{id}/reviews")
    public List<Review> getUserReviews(@PathVariable Long id, @RequestParam(required = false) String type) {
        List<Review> reviews = reviewRepository.findByRevieweeId(id);
        if ("PRODUCT".equals(type)) {
            return reviews.stream().filter(r -> r.getProduct() != null).toList();
        }
        if ("REPAIR".equals(type)) {
            return reviews.stream().filter(r -> r.getBooking() != null).toList();
        }
        return reviews;
    }

    @GetMapping("/products/{productId}/reviews")
    public List<Review> getProductReviews(@PathVariable Long productId) {
        return reviewRepository.findByProductId(productId);
    }
}
