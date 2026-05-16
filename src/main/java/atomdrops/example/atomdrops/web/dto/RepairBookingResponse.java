package atomdrops.example.atomdrops.web.dto;

public class RepairBookingResponse {
    private Long id;
    private Long requestId;
    private Long technicianId;
    private Long technicianUserId;
    private String scheduledDate;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public Long getTechnicianId() { return technicianId; }
    public void setTechnicianId(Long technicianId) { this.technicianId = technicianId; }
    public Long getTechnicianUserId() { return technicianUserId; }
    public void setTechnicianUserId(Long technicianUserId) { this.technicianUserId = technicianUserId; }
    public String getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(String scheduledDate) { this.scheduledDate = scheduledDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
