package atomdrops.example.atomdrops.web.dto;

import java.math.BigDecimal;
import java.util.List;

public class AuctionLotResponse {
    private Long id;
    private Long auctionId;
    private String title;
    private String description;
    private BigDecimal startingPriceBdt;
    private BigDecimal currentBidBdt;
    private String status;
    private List<ImageItem> images;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAuctionId() { return auctionId; }
    public void setAuctionId(Long auctionId) { this.auctionId = auctionId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getStartingPriceBdt() { return startingPriceBdt; }
    public void setStartingPriceBdt(BigDecimal startingPriceBdt) { this.startingPriceBdt = startingPriceBdt; }
    public BigDecimal getCurrentBidBdt() { return currentBidBdt; }
    public void setCurrentBidBdt(BigDecimal currentBidBdt) { this.currentBidBdt = currentBidBdt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<ImageItem> getImages() { return images; }
    public void setImages(List<ImageItem> images) { this.images = images; }

    public static class ImageItem {
        private Long id;
        private String imageUrl;

        public ImageItem() {}
        public ImageItem(Long id, String imageUrl) {
            this.id = id;
            this.imageUrl = imageUrl;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    }
}
