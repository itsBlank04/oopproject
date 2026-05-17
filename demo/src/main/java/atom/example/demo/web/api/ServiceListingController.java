package atom.example.demo.web.api;

import atom.example.demo.category.CategoryRepository;
import atom.example.demo.model.ServiceListing;
import atom.example.demo.model.Technician;
import atom.example.demo.repository.ServiceListingRepository;
import atom.example.demo.repository.TechnicianRepository;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/service-listings")
public class ServiceListingController {

    private final ServiceListingRepository serviceListingRepository;
    private final TechnicianRepository technicianRepository;
    private final CategoryRepository categoryRepository;

    public ServiceListingController(ServiceListingRepository serviceListingRepository,
            TechnicianRepository technicianRepository,
            CategoryRepository categoryRepository) {
        this.serviceListingRepository = serviceListingRepository;
        this.technicianRepository = technicianRepository;
        this.categoryRepository = categoryRepository;
    }

    @GetMapping
    public List<ServiceListing> list(@RequestParam(required = false) Long category) {
        if (category != null) return serviceListingRepository.findByCategoryId(category);
        return serviceListingRepository.findByStatus("ACTIVE");
    }

    @GetMapping("/{id}")
    public ServiceListing getOne(@PathVariable Long id) {
        return serviceListingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Service listing not found"));
    }

    @PostMapping
    public ServiceListing create(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        ServiceListing listing = new ServiceListing();
        listing.setTechnician(tech);
        listing.setTitle((String) body.get("title"));
        listing.setDescription((String) body.get("description"));
        listing.setPriceMinBdt(new BigDecimal(body.get("priceMinBdt").toString()));
        listing.setPriceMaxBdt(new BigDecimal(body.get("priceMaxBdt").toString()));
        if (body.containsKey("availabilityNote")) listing.setAvailabilityNote((String) body.get("availabilityNote"));
        if (body.containsKey("categoryId")) {
            listing.setCategory(categoryRepository.findById(Long.valueOf(body.get("categoryId").toString())).orElse(null));
        }
        return serviceListingRepository.save(listing);
    }

    @PutMapping("/{id}")
    public ServiceListing update(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        ServiceListing listing = serviceListingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Service listing not found"));
        if (!listing.getTechnician().getId().equals(tech.getId())) throw new IllegalArgumentException("Not your listing");
        if (body.containsKey("title")) listing.setTitle((String) body.get("title"));
        if (body.containsKey("description")) listing.setDescription((String) body.get("description"));
        if (body.containsKey("priceMinBdt")) listing.setPriceMinBdt(new BigDecimal(body.get("priceMinBdt").toString()));
        if (body.containsKey("priceMaxBdt")) listing.setPriceMaxBdt(new BigDecimal(body.get("priceMaxBdt").toString()));
        if (body.containsKey("availabilityNote")) listing.setAvailabilityNote((String) body.get("availabilityNote"));
        if (body.containsKey("categoryId")) {
            listing.setCategory(categoryRepository.findById(Long.valueOf(body.get("categoryId").toString())).orElse(null));
        }
        return serviceListingRepository.save(listing);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        ServiceListing listing = serviceListingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Service listing not found"));
        if (!listing.getTechnician().getId().equals(tech.getId())) throw new IllegalArgumentException("Not your listing");
        serviceListingRepository.delete(listing);
        return Map.of("message", "Deleted");
    }
}
