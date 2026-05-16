package atomdrops.example.atomdrops.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class RepairRequestRequest {
    @NotBlank
    private String category;

    @NotBlank
    private String description;

    @NotNull
    private Boolean pickupNeeded;

    private List<MediaItem> media;

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Boolean getPickupNeeded() { return pickupNeeded; }
    public void setPickupNeeded(Boolean pickupNeeded) { this.pickupNeeded = pickupNeeded; }
    public List<MediaItem> getMedia() { return media; }
    public void setMedia(List<MediaItem> media) { this.media = media; }

    public static class MediaItem {
        private String url;
        private String type;

        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }
}
