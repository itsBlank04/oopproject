package atomdrops.example.atomdrops.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class CreateAuctionRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String type;

    @NotNull
    private String startTime;

    @NotNull
    private String endTime;

    private BigDecimal reservePriceBdt;

    @NotNull
    private List<LotRequest> lots;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public BigDecimal getReservePriceBdt() { return reservePriceBdt; }
    public void setReservePriceBdt(BigDecimal reservePriceBdt) { this.reservePriceBdt = reservePriceBdt; }
    public List<LotRequest> getLots() { return lots; }
    public void setLots(List<LotRequest> lots) { this.lots = lots; }

    public static class LotRequest {
        @NotBlank
        private String title;
        private String description;
        @NotNull
        private BigDecimal startingPriceBdt;
        private List<String> imageUrls;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getStartingPriceBdt() { return startingPriceBdt; }
        public void setStartingPriceBdt(BigDecimal startingPriceBdt) { this.startingPriceBdt = startingPriceBdt; }
        public List<String> getImageUrls() { return imageUrls; }
        public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    }
}
