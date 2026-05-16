package atomdrops.example.atomdrops.web.api;

import atomdrops.example.atomdrops.model.ConditionLevel;
import atomdrops.example.atomdrops.repository.ConditionLevelRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/condition-levels")
public class ConditionLevelController {

    private final ConditionLevelRepository conditionLevelRepository;

    public ConditionLevelController(ConditionLevelRepository conditionLevelRepository) {
        this.conditionLevelRepository = conditionLevelRepository;
    }

    @GetMapping
    public ResponseEntity<List<ConditionLevel>> getAll() {
        return ResponseEntity.ok(conditionLevelRepository.findAll());
    }
}
