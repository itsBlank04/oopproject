package atomdrops.example.atomdrops.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import atomdrops.example.atomdrops.model.enums.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "auction_images")
public class AuctionImage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lot_id")
    private AuctionLot lot;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    public AuctionImage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public AuctionLot getLot() { return lot; }
    public void setLot(AuctionLot lot) { this.lot = lot; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
