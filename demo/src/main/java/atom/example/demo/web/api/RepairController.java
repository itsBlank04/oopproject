package atom.example.demo.web.api;

import atom.example.demo.category.Category;
import atom.example.demo.category.CategoryRepository;
import atom.example.demo.model.*;
import atom.example.demo.repository.*;
import jakarta.servlet.http.HttpSession;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/repair")
public class RepairController {

    private final RepairRequestRepository repairRequestRepository;
    private final RepairMediaRepository repairMediaRepository;
    private final RepairQuoteRepository repairQuoteRepository;
    private final RepairBookingRepository repairBookingRepository;
    private final ServiceCompletionRepository serviceCompletionRepository;
    private final RepairProgressRepository repairProgressRepository;
    private final RepairSparePartRepository repairSparePartRepository;
    private final RepairReviewRepository repairReviewRepository;
    private final RepairPaymentRepository repairPaymentRepository;
    private final TechnicianRepository technicianRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public RepairController(
            RepairRequestRepository repairRequestRepository,
            RepairMediaRepository repairMediaRepository,
            RepairQuoteRepository repairQuoteRepository,
            RepairBookingRepository repairBookingRepository,
            ServiceCompletionRepository serviceCompletionRepository,
            RepairProgressRepository repairProgressRepository,
            RepairSparePartRepository repairSparePartRepository,
            RepairReviewRepository repairReviewRepository,
            RepairPaymentRepository repairPaymentRepository,
            TechnicianRepository technicianRepository,
            UserRepository userRepository,
            CategoryRepository categoryRepository) {
        this.repairRequestRepository = repairRequestRepository;
        this.repairMediaRepository = repairMediaRepository;
        this.repairQuoteRepository = repairQuoteRepository;
        this.repairBookingRepository = repairBookingRepository;
        this.serviceCompletionRepository = serviceCompletionRepository;
        this.repairProgressRepository = repairProgressRepository;
        this.repairSparePartRepository = repairSparePartRepository;
        this.repairReviewRepository = repairReviewRepository;
        this.repairPaymentRepository = repairPaymentRepository;
        this.technicianRepository = technicianRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    // ═══════════════════════════════════════════════
    // REPAIR REQUESTS
    // ═══════════════════════════════════════════════

    /** Open requests for technicians to browse — emergency first */
    @GetMapping("/requests/open")
    public List<RepairRequest> getOpenRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        technicianRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        return repairRequestRepository.findByStatusOrderByEmergencyDescCreatedAtDesc("OPEN");
    }

    /** Customer's own requests */
    @GetMapping("/requests/mine")
    public List<RepairRequest> getMyRequests(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return repairRequestRepository.findByCustomerId(userId);
    }

    /** Single request detail */
    @GetMapping("/requests/{id}")
    public RepairRequest getRequest(@PathVariable Long id) {
        return repairRequestRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));
    }

    /** Create a repair request with all fields from master prompt */
    @PostMapping("/requests")
    public RepairRequest createRequest(@RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User customer = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        RepairRequest request = new RepairRequest();
        request.setCustomer(customer);
        request.setDescription((String) body.get("description"));

        // Problem info
        if (body.containsKey("title")) request.setTitle((String) body.get("title"));
        if (body.containsKey("deviceType")) request.setDeviceType((String) body.get("deviceType"));
        if (body.containsKey("brand")) request.setBrand((String) body.get("brand"));
        if (body.containsKey("deviceModel")) request.setDeviceModel((String) body.get("deviceModel"));

        // Category
        if (body.containsKey("categoryId") && body.get("categoryId") != null) {
            Long catId = Long.valueOf(body.get("categoryId").toString());
            categoryRepository.findById(catId).ifPresent(request::setCategory);
        }

        // Service location
        if (body.containsKey("serviceLocation")) request.setServiceLocation((String) body.get("serviceLocation"));
        if (body.containsKey("contactNumber")) request.setContactNumber((String) body.get("contactNumber"));
        if (body.containsKey("landmark")) request.setLandmark((String) body.get("landmark"));
        if (body.containsKey("pickupNeeded")) request.setPickupNeeded(Boolean.parseBoolean(body.get("pickupNeeded").toString()));

        // Schedule
        if (body.containsKey("preferredDate") && body.get("preferredDate") != null) {
            request.setPreferredDate(LocalDate.parse(body.get("preferredDate").toString()));
        }
        if (body.containsKey("preferredTimeSlot")) request.setPreferredTimeSlot((String) body.get("preferredTimeSlot"));
        if (body.containsKey("flexibleSchedule")) request.setFlexibleSchedule(Boolean.parseBoolean(body.get("flexibleSchedule").toString()));

        // Urgency
        if (body.containsKey("emergency")) request.setEmergency(Boolean.parseBoolean(body.get("emergency").toString()));
        if (body.containsKey("urgencyLevel")) request.setUrgencyLevel((String) body.get("urgencyLevel"));

        return repairRequestRepository.save(request);
    }

    /** Cancel a repair request */
    @PutMapping("/requests/{id}/cancel")
    public RepairRequest cancelRequest(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairRequest request = repairRequestRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        if (!request.getCustomer().getId().equals(userId)) throw new IllegalArgumentException("Not your request");
        if (!"OPEN".equals(request.getStatus()) && !"QUOTED".equals(request.getStatus()))
            throw new IllegalArgumentException("Cannot cancel in current status");
        request.setStatus("CANCELLED");
        return repairRequestRepository.save(request);
    }

    // ═══════════════════════════════════════════════
    // MEDIA
    // ═══════════════════════════════════════════════

    @PostMapping("/requests/{id}/media")
    public RepairMedia addMedia(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairRequest request = repairRequestRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        if (!request.getCustomer().getId().equals(userId)) throw new IllegalArgumentException("Not your request");
        RepairMedia media = new RepairMedia();
        media.setRequest(request);
        media.setMediaUrl((String) body.get("mediaUrl"));
        media.setMediaType((String) body.get("mediaType"));
        return repairMediaRepository.save(media);
    }

    // ═══════════════════════════════════════════════
    // QUOTES (PROPOSALS)
    // ═══════════════════════════════════════════════

    /** Technician submits a quote/proposal */
    @PostMapping("/requests/{id}/quotes")
    public RepairQuote submitQuote(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        RepairRequest request = repairRequestRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        RepairQuote quote = new RepairQuote();
        quote.setRequest(request);
        quote.setTechnician(tech);
        quote.setQuoteBdt(new BigDecimal(body.get("quoteBdt").toString()));
        if (body.containsKey("plan")) quote.setPlan((String) body.get("plan"));
        if (body.containsKey("estimatedDuration")) quote.setEstimatedDuration((String) body.get("estimatedDuration"));
        if (body.containsKey("visitCharge") && body.get("visitCharge") != null)
            quote.setVisitCharge(new BigDecimal(body.get("visitCharge").toString()));
        if (body.containsKey("requiredParts")) quote.setRequiredParts((String) body.get("requiredParts"));
        if (body.containsKey("serviceNotes")) quote.setServiceNotes((String) body.get("serviceNotes"));

        RepairQuote saved = repairQuoteRepository.save(quote);

        // Update request status to QUOTED
        if ("OPEN".equals(request.getStatus())) {
            request.setStatus("QUOTED");
            repairRequestRepository.save(request);
        }

        return saved;
    }

    /** Get quotes for a request */
    @GetMapping("/requests/{id}/quotes")
    public List<RepairQuote> getQuotes(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairRequest request = repairRequestRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));
        // Allow customer or any technician
        if (!request.getCustomer().getId().equals(userId)) {
            Technician tech = technicianRepository.findByUserId(userId).orElse(null);
            if (tech == null) throw new IllegalArgumentException("Not authorized");
        }
        return repairQuoteRepository.findByRequestId(id);
    }

    /** Accept a quote → creates a booking */
    @PutMapping("/quotes/{id}/accept")
    public RepairBooking acceptQuote(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairQuote quote = repairQuoteRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Quote not found"));
        if (!quote.getRequest().getCustomer().getId().equals(userId))
            throw new IllegalArgumentException("Not your request");

        quote.setStatus("ACCEPTED");
        repairQuoteRepository.save(quote);

        // Reject other quotes
        List<RepairQuote> otherQuotes = repairQuoteRepository.findByRequestId(quote.getRequest().getId());
        for (RepairQuote q : otherQuotes) {
            if (!q.getId().equals(id) && "SENT".equals(q.getStatus())) {
                q.setStatus("REJECTED");
                repairQuoteRepository.save(q);
            }
        }

        // Update request status
        RepairRequest request = quote.getRequest();
        request.setStatus("BOOKED");
        repairRequestRepository.save(request);

        // Create booking
        RepairBooking booking = new RepairBooking();
        booking.setRequest(request);
        booking.setTechnician(quote.getTechnician());
        booking.setScheduledDate(LocalDate.parse(body.get("scheduledDate").toString()));
        if (body.containsKey("scheduledTimeSlot"))
            booking.setScheduledTimeSlot((String) body.get("scheduledTimeSlot"));

        return repairBookingRepository.save(booking);
    }

    /** Reject a quote */
    @PutMapping("/quotes/{id}/reject")
    public RepairQuote rejectQuote(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairQuote quote = repairQuoteRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Quote not found"));
        if (!quote.getRequest().getCustomer().getId().equals(userId))
            throw new IllegalArgumentException("Not your request");
        quote.setStatus("REJECTED");
        return repairQuoteRepository.save(quote);
    }

    // ═══════════════════════════════════════════════
    // BOOKINGS
    // ═══════════════════════════════════════════════

    /** Technician's bookings */
    @GetMapping("/bookings/mine")
    public List<RepairBooking> getMyBookings(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId).orElse(null);
        if (tech != null) {
            return repairBookingRepository.findByTechnicianId(tech.getId());
        }
        return List.of();
    }

    /** Customer's bookings */
    @GetMapping("/bookings/customer")
    public List<RepairBooking> getCustomerBookings(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        return repairBookingRepository.findByRequestCustomerId(userId);
    }

    /** Single booking detail */
    @GetMapping("/bookings/{id}")
    public RepairBooking getBooking(@PathVariable Long id) {
        return repairBookingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
    }

    /** Update booking status (technician only) */
    @PutMapping("/bookings/{id}/status")
    public RepairBooking updateBookingStatus(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        RepairBooking booking = repairBookingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getTechnician().getId().equals(tech.getId()))
            throw new IllegalArgumentException("Not your booking");

        String newStatus = (String) body.get("status");
        booking.setStatus(newStatus);
        return repairBookingRepository.save(booking);
    }

    /** Complete booking (technician marks done) */
    @PutMapping("/bookings/{id}/complete")
    public ServiceCompletion completeBooking(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        RepairBooking booking = repairBookingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getTechnician().getId().equals(tech.getId()))
            throw new IllegalArgumentException("Not your booking");

        booking.setStatus("COMPLETED");

        // Set warranty if provided
        if (body != null && body.containsKey("warrantyDays")) {
            int days = Integer.parseInt(body.get("warrantyDays").toString());
            booking.setWarrantyDays(days);
            if (days > 0) {
                booking.setWarrantyExpiresAt(Instant.now().plus(days, ChronoUnit.DAYS));
            }
        }

        repairBookingRepository.save(booking);

        // Update request status
        booking.getRequest().setStatus("COMPLETED");
        repairRequestRepository.save(booking.getRequest());

        // Increment technician completed jobs
        tech.setCompletedJobs(tech.getCompletedJobs() + 1);
        technicianRepository.save(tech);

        ServiceCompletion completion = new ServiceCompletion();
        completion.setBooking(booking);
        if (body != null && body.containsKey("notes")) completion.setNotes((String) body.get("notes"));
        return serviceCompletionRepository.save(completion);
    }

    // ═══════════════════════════════════════════════
    // PROGRESS TRACKING
    // ═══════════════════════════════════════════════

    /** Get progress timeline for a booking */
    @GetMapping("/bookings/{id}/progress")
    public List<RepairProgress> getProgress(@PathVariable Long id) {
        return repairProgressRepository.findByBookingIdOrderByCreatedAtAsc(id);
    }

    /** Technician adds a progress update */
    @PostMapping("/bookings/{id}/progress")
    public RepairProgress addProgress(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        RepairBooking booking = repairBookingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getTechnician().getId().equals(tech.getId()))
            throw new IllegalArgumentException("Not your booking");

        RepairProgress progress = new RepairProgress();
        progress.setBooking(booking);
        progress.setStatus((String) body.get("status"));
        if (body.containsKey("note")) progress.setNote((String) body.get("note"));
        if (body.containsKey("photoUrl")) progress.setPhotoUrl((String) body.get("photoUrl"));

        return repairProgressRepository.save(progress);
    }

    // ═══════════════════════════════════════════════
    // SPARE PARTS
    // ═══════════════════════════════════════════════

    @GetMapping("/bookings/{id}/parts")
    public List<RepairSparePart> getParts(@PathVariable Long id) {
        return repairSparePartRepository.findByBookingId(id);
    }

    @PostMapping("/bookings/{id}/parts")
    public RepairSparePart addPart(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        Technician tech = technicianRepository.findByUserId(userId)
            .orElseThrow(() -> new IllegalArgumentException("Technician profile not found"));
        RepairBooking booking = repairBookingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getTechnician().getId().equals(tech.getId()))
            throw new IllegalArgumentException("Not your booking");

        RepairSparePart part = new RepairSparePart();
        part.setBooking(booking);
        part.setPartName((String) body.get("partName"));
        part.setQuantity(body.containsKey("quantity") ? Integer.parseInt(body.get("quantity").toString()) : 1);
        part.setPriceBdt(new BigDecimal(body.get("priceBdt").toString()));
        if (body.containsKey("reason")) part.setReason((String) body.get("reason"));

        return repairSparePartRepository.save(part);
    }

    /** Customer approves a spare part */
    @PutMapping("/parts/{id}/approve")
    public RepairSparePart approvePart(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        RepairSparePart part = repairSparePartRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Part not found"));
        if (!part.getBooking().getRequest().getCustomer().getId().equals(userId))
            throw new IllegalArgumentException("Not your booking");
        part.setApprovedByCustomer(true);
        return repairSparePartRepository.save(part);
    }

    // ═══════════════════════════════════════════════
    // REVIEWS
    // ═══════════════════════════════════════════════

    @GetMapping("/bookings/{id}/review")
    public ResponseEntity<RepairReview> getReview(@PathVariable Long id) {
        return repairReviewRepository.findByBookingId(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/bookings/{id}/review")
    public RepairReview submitReview(@PathVariable Long id, @RequestBody Map<String, Object> body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) throw new IllegalArgumentException("Not authenticated");
        User customer = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        RepairBooking booking = repairBookingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getRequest().getCustomer().getId().equals(userId))
            throw new IllegalArgumentException("Not your booking");
        if (!"COMPLETED".equals(booking.getStatus()) && !"CLOSED".equals(booking.getStatus()))
            throw new IllegalArgumentException("Booking not completed yet");
        if (repairReviewRepository.findByBookingId(id).isPresent())
            throw new IllegalArgumentException("Already reviewed");

        RepairReview review = new RepairReview();
        review.setBooking(booking);
        review.setCustomer(customer);
        review.setTechnician(booking.getTechnician());
        review.setWorkQuality(Integer.parseInt(body.get("workQuality").toString()));
        review.setProfessionalism(Integer.parseInt(body.get("professionalism").toString()));
        review.setCommunication(Integer.parseInt(body.get("communication").toString()));
        review.setTimeliness(Integer.parseInt(body.get("timeliness").toString()));
        review.setPricingFairness(Integer.parseInt(body.get("pricingFairness").toString()));
        if (body.containsKey("comment")) review.setComment((String) body.get("comment"));

        RepairReview saved = repairReviewRepository.save(review);

        // Update technician rating average
        Technician tech = booking.getTechnician();
        List<RepairReview> allReviews = repairReviewRepository.findByTechnicianId(tech.getId());
        double avg = allReviews.stream()
            .mapToDouble(r -> (r.getWorkQuality() + r.getProfessionalism() + r.getCommunication()
                + r.getTimeliness() + r.getPricingFairness()) / 5.0)
            .average().orElse(0);
        tech.setRatingAvg(BigDecimal.valueOf(avg).setScale(2, java.math.RoundingMode.HALF_UP));
        technicianRepository.save(tech);

        return saved;
    }

    // ═══════════════════════════════════════════════
    // STATS (public)
    // ═══════════════════════════════════════════════

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalTechnicians", technicianRepository.count());
        stats.put("totalRepairs", repairBookingRepository.count());
        long completed = repairBookingRepository.findAll().stream()
            .filter(b -> "COMPLETED".equals(b.getStatus()) || "CLOSED".equals(b.getStatus()))
            .count();
        stats.put("completedRepairs", completed);
        List<RepairReview> allReviews = repairReviewRepository.findAll();
        if (!allReviews.isEmpty()) {
            double avgRating = allReviews.stream()
                .mapToDouble(r -> (r.getWorkQuality() + r.getProfessionalism() + r.getCommunication()
                    + r.getTimeliness() + r.getPricingFairness()) / 5.0)
                .average().orElse(0);
            stats.put("avgRating", BigDecimal.valueOf(avgRating).setScale(1, java.math.RoundingMode.HALF_UP));
        } else {
            stats.put("avgRating", "4.8");
        }
        stats.put("totalReviews", allReviews.size());
        return stats;
    }
}
