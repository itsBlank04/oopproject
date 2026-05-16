package atomdrops.example.atomdrops.web.dto;

import java.math.BigDecimal;

public class RepairQuoteResponse {
    private Long id;
    private Long requestId;
    private Long technicianId;
    private String technicianName;
    private BigDecimal quoteBdt;
    private String plan;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public String getTechnicianName() { return technicianName; }
    public void setTechnicianName(String technicianName) { this.technicianName = technicianName; }
    public BigDecimal getQuoteBdt() { return quoteBdt; }
    public void setQuoteBdt(BigDecimal quoteBdt) { this.quoteBdt = quoteBdt; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
