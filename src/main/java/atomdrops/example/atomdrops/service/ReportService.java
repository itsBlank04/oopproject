package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Report;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.enums.FraudFlagStatus;
import atomdrops.example.atomdrops.repository.ReportRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public ReportService(ReportRepository reportRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    public Report createReport(Long reporterId, Long reportedId, String reason) {
        User reporter = userRepository.findById(reporterId)
            .orElseThrow(() -> new IllegalArgumentException("Reporter not found"));
        User reported = userRepository.findById(reportedId)
            .orElseThrow(() -> new IllegalArgumentException("Reported user not found"));
        if (reporterId.equals(reportedId)) throw new IllegalArgumentException("Cannot report yourself");
        Report r = new Report();
        r.setReporter(reporter);
        r.setReported(reported);
        r.setReason(reason);
        r.setStatus(FraudFlagStatus.OPEN);
        return reportRepository.save(r);
    }

    @Transactional(readOnly = true)
    public List<Report> getReportsForUser(Long userId) {
        return reportRepository.findByReported_Id(userId);
    }

    @Transactional(readOnly = true)
    public List<Report> getAllReports() {
        return reportRepository.findAll();
    }

    public void resolveReport(Long reportId) {
        Report r = reportRepository.findById(reportId)
            .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        r.setStatus(FraudFlagStatus.RESOLVED);
        r.setResolvedAt(Instant.now());
        reportRepository.save(r);
    }
}
