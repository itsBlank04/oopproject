package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.ServiceListing;
import atomdrops.example.atomdrops.model.Technician;
import atomdrops.example.atomdrops.model.enums.ServiceStatus;
import atomdrops.example.atomdrops.repository.ServiceListingRepository;
import atomdrops.example.atomdrops.repository.TechnicianRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ServiceListingService {

    private final ServiceListingRepository serviceListingRepository;
    private final TechnicianRepository technicianRepository;

    public ServiceListingService(ServiceListingRepository serviceListingRepository, TechnicianRepository technicianRepository) {
        this.serviceListingRepository = serviceListingRepository;
        this.technicianRepository = technicianRepository;
    }

    public ServiceListing create(Long technicianUserId, String category, BigDecimal priceMin, BigDecimal priceMax, String availabilityNote) {
        Technician tech = technicianRepository.findByUser_Id(technicianUserId)
            .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        ServiceListing sl = new ServiceListing();
        sl.setTechnician(tech);
        sl.setCategory(category);
        sl.setPriceMinBdt(priceMin);
        sl.setPriceMaxBdt(priceMax);
        sl.setAvailabilityNote(availabilityNote);
        sl.setStatus(ServiceStatus.ACTIVE);
        return serviceListingRepository.save(sl);
    }

    public ServiceListing update(Long id, Long technicianUserId, String category, BigDecimal priceMin, BigDecimal priceMax, String availabilityNote, ServiceStatus status) {
        Technician tech = technicianRepository.findByUser_Id(technicianUserId)
            .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        ServiceListing sl = serviceListingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Service listing not found"));
        if (!sl.getTechnician().getId().equals(tech.getId())) {
            throw new IllegalArgumentException("Not your listing");
        }
        if (category != null) sl.setCategory(category);
        if (priceMin != null) sl.setPriceMinBdt(priceMin);
        if (priceMax != null) sl.setPriceMaxBdt(priceMax);
        if (availabilityNote != null) sl.setAvailabilityNote(availabilityNote);
        if (status != null) sl.setStatus(status);
        return serviceListingRepository.save(sl);
    }

    public void delete(Long id, Long technicianUserId) {
        ServiceListing sl = serviceListingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Service listing not found"));
        Technician tech = technicianRepository.findByUser_Id(technicianUserId)
            .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        if (!sl.getTechnician().getId().equals(tech.getId())) {
            throw new IllegalArgumentException("Not your listing");
        }
        sl.setStatus(ServiceStatus.INACTIVE);
        serviceListingRepository.save(sl);
    }

    @Transactional(readOnly = true)
    public List<ServiceListing> findAll() {
        return serviceListingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ServiceListing> findByTechnician(Long technicianUserId) {
        Technician tech = technicianRepository.findByUser_Id(technicianUserId)
            .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        return serviceListingRepository.findByTechnician_Id(tech.getId());
    }
}
