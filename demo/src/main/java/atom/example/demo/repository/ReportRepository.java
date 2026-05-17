package atom.example.demo.repository;
import atom.example.demo.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReportedId(Long reportedId);
    List<Report> findByReporterId(Long reporterId);
    List<Report> findByStatus(String status);
}
