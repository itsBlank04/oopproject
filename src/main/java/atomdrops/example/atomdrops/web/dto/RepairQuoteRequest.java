package atomdrops.example.atomdrops.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public class RepairQuoteRequest {
    @NotNull
    @Positive
    private BigDecimal quoteBdt;
    private String plan;

    public BigDecimal getQuoteBdt() { return quoteBdt; }
    public void setQuoteBdt(BigDecimal quoteBdt) { this.quoteBdt = quoteBdt; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
}
