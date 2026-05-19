package atom.example.demo.web.api;

import atom.example.demo.config.SecurityConfig;
import atom.example.demo.model.Technician;
import atom.example.demo.model.TechnicianAvailability;
import atom.example.demo.model.TechnicianEarning;
import atom.example.demo.repository.TechnicianAvailabilityRepository;
import atom.example.demo.repository.TechnicianEarningRepository;
import atom.example.demo.repository.TechnicianRepository;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TechnicianController {

    private final TechnicianRepository technicianRepository;
    private final TechnicianAvailabilityRepository technicianAvailabilityRepository;
    private final TechnicianEarningRepository technicianEarningRepository;

    public TechnicianController(TechnicianRepository technicianRepository,
            TechnicianAvailabilityRepository technicianAvailabilityRepository,
            TechnicianEarningRepository technicianEarningRepository) {
        this.technicianRepository = technicianRepository;
        this.technicianAvailabilityRepository = technicianAvailabilityRepository;
        this.technicianEarningRepository = technicianEarningRepository;
    }

    @GetMapping("/technicians")
    public List<Technician> list(@RequestParam(required = false) String specialization,
            @RequestParam(required = false) String level, @RequestParam(required = false) String status) {
        if (specialization != null) return technicianRepository.findBySpecialization(specialization);
        if (level != null) return technicianRepository.findByLevel(level);
        if (status != null) return technicianRepository.findByStatus(status);
        return technicianRepository.findAll();
    }

    @GetMapping("/technicians/{id}")
    public Technician getPublicProfile(@PathVariable Long id) {
        return technicianRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Technician not found"));
    }

    @PutMapping("/technician/profile")
    public Technician updateProfile(@RequestBody Map<String, Object> body, HttpSession session) {
        if (!SecurityConfig.hasRole("TECHNICIAN")) throw new SecurityException("Technician access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        if (body.containsKey("bio")) tech.setBio((String) body.get("bio"));
        if (body.containsKey("specialization")) tech.setSpecialization((String) body.get("specialization"));
        if (body.containsKey("pickupAvailable")) tech.setPickupAvailable(Boolean.parseBoolean(body.get("pickupAvailable").toString()));
        if (body.containsKey("serviceArea")) tech.setServiceArea((String) body.get("serviceArea"));
        if (body.containsKey("websiteUrl")) tech.setWebsiteUrl((String) body.get("websiteUrl"));
        if (body.containsKey("socialLinks")) tech.setSocialLinks((String) body.get("socialLinks"));
        if (body.containsKey("status")) tech.setStatus((String) body.get("status"));
        return technicianRepository.save(tech);
    }

    @GetMapping("/technician/availability")
    public List<TechnicianAvailability> getAvailability(HttpSession session) {
        if (!SecurityConfig.hasRole("TECHNICIAN")) throw new SecurityException("Technician access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        return technicianAvailabilityRepository.findByTechnicianId(tech.getId());
    }

    @PutMapping("/technician/availability")
    public List<TechnicianAvailability> updateAvailability(@RequestBody List<Map<String, Object>> entries, HttpSession session) {
        if (!SecurityConfig.hasRole("TECHNICIAN")) throw new SecurityException("Technician access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        List<TechnicianAvailability> existing = technicianAvailabilityRepository.findByTechnicianId(tech.getId());
        technicianAvailabilityRepository.deleteAll(existing);
        for (Map<String, Object> entry : entries) {
            TechnicianAvailability avail = new TechnicianAvailability();
            avail.setTechnician(tech);
            avail.setDayOfWeek(Short.parseShort(entry.get("dayOfWeek").toString()));
            avail.setStartTime(java.time.LocalTime.parse(entry.get("startTime").toString()));
            avail.setEndTime(java.time.LocalTime.parse(entry.get("endTime").toString()));
            if (entry.containsKey("isAvailable")) avail.setAvailable(Boolean.parseBoolean(entry.get("isAvailable").toString()));
            technicianAvailabilityRepository.save(avail);
        }
        return technicianAvailabilityRepository.findByTechnicianId(tech.getId());
    }

    @GetMapping("/technician/earnings")
    public List<TechnicianEarning> getEarnings(HttpSession session) {
        if (!SecurityConfig.hasRole("TECHNICIAN")) throw new SecurityException("Technician access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        return technicianEarningRepository.findByTechnicianId(tech.getId());
    }

    @GetMapping("/technician/dashboard")
    public Map<String, Object> dashboard(HttpSession session) {
        if (!SecurityConfig.hasRole("TECHNICIAN")) throw new SecurityException("Technician access required");
        Long userId = SecurityConfig.getSessionUserId();
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        List<TechnicianEarning> earnings = technicianEarningRepository.findByTechnicianId(tech.getId());
        int totalJobs = earnings.size();
        int pendingPayouts = (int) earnings.stream().filter(e -> "PENDING".equals(e.getStatus())).count();
        double totalEarned = earnings.stream().filter(e -> "PAID".equals(e.getStatus())).mapToDouble(e -> e.getNetAmountBdt().doubleValue()).sum();
        return Map.of("technicianId", tech.getId(), "level", tech.getLevel(), "ratingAvg", tech.getRatingAvg(),
                "completionRate", tech.getCompletionRate(), "status", tech.getStatus(), "totalJobs", totalJobs,
                "pendingPayouts", pendingPayouts, "totalEarned", totalEarned);
    }
}
