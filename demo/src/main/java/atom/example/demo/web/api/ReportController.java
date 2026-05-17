package atom.example.demo.web.api;

import atom.example.demo.model.Report;
import atom.example.demo.model.User;
import atom.example.demo.repository.ReportRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public ReportController(ReportRepository reportRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public Report create(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User reporter = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Report report = new Report();
        report.setReporter(reporter);
        if (body.containsKey("reportedId")) {
            User reported = userRepository.findById(Long.valueOf(body.get("reportedId").toString())).orElse(null);
            report.setReported(reported);
        }
        if (body.containsKey("entityType")) report.setEntityType((String) body.get("entityType"));
        if (body.containsKey("entityId")) report.setEntityId(Long.valueOf(body.get("entityId").toString()));
        report.setReason((String) body.get("reason"));
        return reportRepository.save(report);
    }
}
