package atomdrops.example.atomdrops.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.util.List;

public class UsedListingRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    @Positive
    private BigDecimal priceBdt;

    @NotNull
    private Long categoryId;

    @NotNull
    private Long conditionId;

    @NotBlank
    private String warrantyFlag;

    private List<String> imageUrls;
    private List<String> videoUrls;

    private Integer ownerCount;
    private Integer usageDurationMonths;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getPriceBdt() { return priceBdt; }
    public void setPriceBdt(BigDecimal priceBdt) { this.priceBdt = priceBdt; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public Long getConditionId() { return conditionId; }
    public void setConditionId(Long conditionId) { this.conditionId = conditionId; }
    public String getWarrantyFlag() { return warrantyFlag; }
    public void setWarrantyFlag(String warrantyFlag) { this.warrantyFlag = warrantyFlag; }
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public List<String> getVideoUrls() { return videoUrls; }
    public void setVideoUrls(List<String> videoUrls) { this.videoUrls = videoUrls; }
    public Integer getOwnerCount() { return ownerCount; }
    public void setOwnerCount(Integer ownerCount) { this.ownerCount = ownerCount; }
    public Integer getUsageDurationMonths() { return usageDurationMonths; }
    public void setUsageDurationMonths(Integer usageDurationMonths) { this.usageDurationMonths = usageDurationMonths; }
}
