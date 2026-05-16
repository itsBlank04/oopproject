package atomdrops.example.atomdrops.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class UsedListingResponse {
    private Long id;
    private Long sellerId;
    private String sellerName;
    private Long categoryId;
    private String categoryName;
    private Long conditionId;
    private String conditionLabel;
    private String title;
    private String description;
    private BigDecimal priceBdt;
    private String warrantyFlag;
    private String status;
    private Instant createdAt;
    private List<MediaItem> images;
    private List<MediaItem> videos;
    private History history;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSellerId() { return sellerId; }
    public void setSellerId(Long sellerId) { this.sellerId = sellerId; }
    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public Long getConditionId() { return conditionId; }
    public void setConditionId(Long conditionId) { this.conditionId = conditionId; }
    public String getConditionLabel() { return conditionLabel; }
    public void setConditionLabel(String conditionLabel) { this.conditionLabel = conditionLabel; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPriceBdt() { return priceBdt; }
    public void setPriceBdt(BigDecimal priceBdt) { this.priceBdt = priceBdt; }
    public String getWarrantyFlag() { return warrantyFlag; }
    public void setWarrantyFlag(String warrantyFlag) { this.warrantyFlag = warrantyFlag; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public List<MediaItem> getImages() { return images; }
    public void setImages(List<MediaItem> images) { this.images = images; }
    public List<MediaItem> getVideos() { return videos; }
    public void setVideos(List<MediaItem> videos) { this.videos = videos; }
    public History getHistory() { return history; }
    public void setHistory(History history) { this.history = history; }

    public static class MediaItem {
        private Long id;
        private String url;
        private Integer sortOrder;

        public MediaItem() {}
        public MediaItem(Long id, String url, Integer sortOrder) {
            this.id = id;
            this.url = url;
            this.sortOrder = sortOrder;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public Integer getSortOrder() { return sortOrder; }
        public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    }

    public static class History {
        private Long id;
        private int ownerCount;
        private Integer usageDurationMonths;

        public History() {}
        public History(Long id, int ownerCount, Integer usageDurationMonths) {
            this.id = id;
            this.ownerCount = ownerCount;
            this.usageDurationMonths = usageDurationMonths;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public int getOwnerCount() { return ownerCount; }
        public void setOwnerCount(int ownerCount) { this.ownerCount = ownerCount; }
        public Integer getUsageDurationMonths() { return usageDurationMonths; }
        public void setUsageDurationMonths(Integer usageDurationMonths) { this.usageDurationMonths = usageDurationMonths; }
    }
}
