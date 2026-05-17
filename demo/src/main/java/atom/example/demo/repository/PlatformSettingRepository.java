package atom.example.demo.repository;
import atom.example.demo.model.PlatformSetting;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, String> {
}
