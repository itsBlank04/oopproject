package atom.example.demo.web.api;

import atom.example.demo.model.RepairBooking;
import atom.example.demo.model.RepairMedia;
import atom.example.demo.model.RepairQuote;
import atom.example.demo.model.RepairRequest;
import atom.example.demo.model.ServiceCompletion;
import atom.example.demo.model.Technician;
import atom.example.demo.model.User;
import atom.example.demo.repository.RepairBookingRepository;
import atom.example.demo.repository.RepairMediaRepository;
import atom.example.demo.repository.RepairQuoteRepository;
import atom.example.demo.repository.RepairRequestRepository;
import atom.example.demo.repository.ServiceCompletionRepository;
import atom.example.demo.repository.TechnicianRepository;
import atom.example.demo.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/repair")
public class RepairController {

    private final RepairRequestRepository repairRequestRepository;
    private final RepairMediaRepository repairMediaRepository;
    private final RepairQuoteRepository repairQuoteRepository;
    private final RepairBookingRepository repairBookingRepository;
    private final ServiceCompletionRepository serviceCompletionRepository;
    private final TechnicianRepository technicianRepository;
    private final UserRepository userRepository;

    public RepairController(RepairRequestRepository repairRequestRepository,
            RepairMediaRepository repairMediaRepository, RepairQuoteRepository repairQuoteRepository,
            RepairBookingRepository repairBookingRepository,
            ServiceCompletionRepository serviceCompletionRepository,
            TechnicianRepository technicianRepository, UserRepository userRepository) {
        this.repairRequestRepository = repairRequestRepository;
        this.repairMediaRepository = repairMediaRepository;
        this.repairQuoteRepository = repairQuoteRepository;
        this.repairBookingRepository = repairBookingRepository;
        this.serviceCompletionRepository = serviceCompletionRepository;
        this.technicianRepository = technicianRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/requests/open")
    public List<RepairRequest> getOpenRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        return repairRequestRepository.findByStatus("OPEN");
    }

    @GetMapping("/requests/mine")
    public List<RepairRequest> getMyRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return repairRequestRepository.findByCustomerId(userId);
    }

    @GetMapping("/requests/{id}")
    public RepairRequest getRequest(@PathVariable Long id) {
        return repairRequestRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Request not found"));
    }

    @PostMapping("/requests")
    public RepairRequest createRequest(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User customer = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        RepairRequest request = new RepairRequest();
        request.setCustomer(customer);
        request.setDescription((String) body.get("description"));
        if (body.containsKey("pickupNeeded")) request.setPickupNeeded(Boolean.parseBoolean(body.get("pickupNeeded").toString()));
        return repairRequestRepository.save(request);
    }

    @PostMapping("/requests/{id}/media")
    public RepairMedia addMedia(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairRequest request = repairRequestRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Request not found"));
        if (!request.getCustomer().getId().equals(userId)) throw new IllegalArgumentException("Not your request");
        RepairMedia media = new RepairMedia();
        media.setRequest(request);
        media.setMediaUrl((String) body.get("mediaUrl"));
        media.setMediaType((String) body.get("mediaType"));
        return repairMediaRepository.save(media);
    }

    @PostMapping("/requests/{id}/quotes")
    public RepairQuote submitQuote(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        RepairRequest request = repairRequestRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Request not found"));
        RepairQuote quote = new RepairQuote();
        quote.setRequest(request);
        quote.setTechnician(tech);
        quote.setQuoteBdt(new BigDecimal(body.get("quoteBdt").toString()));
        if (body.containsKey("plan")) quote.setPlan((String) body.get("plan"));
        return repairQuoteRepository.save(quote);
    }

    @GetMapping("/requests/{id}/quotes")
    public List<RepairQuote> getQuotes(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairRequest request = repairRequestRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Request not found"));
        if (!request.getCustomer().getId().equals(userId)) {
            Technician tech = technicianRepository.findByUserId(userId).orElse(null);
            if (tech == null) throw new IllegalArgumentException("Not authorized");
        }
        return repairQuoteRepository.findByRequestId(id);
    }

    @PutMapping("/quotes/{id}/accept")
    public RepairBooking acceptQuote(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairQuote quote = repairQuoteRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Quote not found"));
        if (!quote.getRequest().getCustomer().getId().equals(userId)) throw new IllegalArgumentException("Not your request");
        quote.setStatus("ACCEPTED");
        repairQuoteRepository.save(quote);
        RepairBooking booking = new RepairBooking();
        booking.setRequest(quote.getRequest());
        booking.setTechnician(quote.getTechnician());
        booking.setScheduledDate(LocalDate.parse(body.get("scheduledDate").toString()));
        return repairBookingRepository.save(booking);
    }

    @PutMapping("/quotes/{id}/reject")
    public RepairQuote rejectQuote(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairQuote quote = repairQuoteRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Quote not found"));
        if (!quote.getRequest().getCustomer().getId().equals(userId)) throw new IllegalArgumentException("Not your request");
        quote.setStatus("REJECTED");
        return repairQuoteRepository.save(quote);
    }

    @GetMapping("/bookings/mine")
    public List<RepairBooking> getMyBookings(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElse(null);
        if (tech != null) {
            return repairBookingRepository.findByTechnicianId(tech.getId());
        }
        return repairBookingRepository.findByTechnicianId(-1L);
    }

    @GetMapping("/bookings/{id}")
    public RepairBooking getBooking(@PathVariable Long id) {
        return repairBookingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Booking not found"));
    }

    @PutMapping("/bookings/{id}/complete")
    public ServiceCompletion completeBooking(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        RepairBooking booking = repairBookingRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getTechnician().getId().equals(tech.getId())) throw new IllegalArgumentException("Not your booking");
        booking.setStatus("COMPLETED");
        repairBookingRepository.save(booking);
        ServiceCompletion completion = new ServiceCompletion();
        completion.setBooking(booking);
        if (body != null && body.containsKey("notes")) completion.setNotes((String) body.get("notes"));
        return serviceCompletionRepository.save(completion);
    }
}
