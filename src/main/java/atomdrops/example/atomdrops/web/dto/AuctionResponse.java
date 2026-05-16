package atomdrops.example.atomdrops.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

public class AuctionResponse {
    private Long id;
    private Long vendorId;
    private String vendorName;
    private String title;
    private String type;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal reservePriceBdt;
    private Instant createdAt;
    private List<AuctionLotResponse> lots;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVendorId() { return vendorId; }
    public void setVendorId(Long vendorId) { this.vendorId = vendorId; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public BigDecimal getReservePriceBdt() { return reservePriceBdt; }
    public void setReservePriceBdt(BigDecimal reservePriceBdt) { this.reservePriceBdt = reservePriceBdt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public List<AuctionLotResponse> getLots() { return lots; }
    public void setLots(List<AuctionLotResponse> lots) { this.lots = lots; }
}
