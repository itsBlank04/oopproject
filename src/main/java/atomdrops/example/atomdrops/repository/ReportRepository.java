package atomdrops.example.atomdrops.repository;

import atomdrops.example.atomdrops.model.Report;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReported_Id(Long reportedId);
}
