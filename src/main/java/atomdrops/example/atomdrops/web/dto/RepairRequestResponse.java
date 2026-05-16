package atomdrops.example.atomdrops.web.dto;

import java.time.Instant;
import java.util.List;

public class RepairRequestResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String category;
    private String description;
    private Boolean pickupNeeded;
    private String status;
    private Instant createdAt;
    private List<MediaItem> media;
    private RepairBookingResponse activeBooking;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getPickupNeeded() { return pickupNeeded; }
    public void setPickupNeeded(Boolean pickupNeeded) { this.pickupNeeded = pickupNeeded; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public List<MediaItem> getMedia() { return media; }
    public void setMedia(List<MediaItem> media) { this.media = media; }
    public RepairBookingResponse getActiveBooking() { return activeBooking; }
    public void setActiveBooking(RepairBookingResponse activeBooking) { this.activeBooking = activeBooking; }

    public static class MediaItem {
        private Long id;
        private String url;
        private String type;

        public MediaItem() {}
        public MediaItem(Long id, String url, String type) {
            this.id = id;
            this.url = url;
            this.type = type;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
}
