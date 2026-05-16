package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Review;
import atomdrops.example.atomdrops.model.RepairBooking;
import atomdrops.example.atomdrops.model.RepairMedia;
import atomdrops.example.atomdrops.model.RepairQuote;
import atomdrops.example.atomdrops.model.RepairRequest;
import atomdrops.example.atomdrops.model.ServiceCompletion;
import atomdrops.example.atomdrops.model.Technician;
import atomdrops.example.atomdrops.model.User;
import atomdrops.example.atomdrops.model.enums.BookingStatus;
import atomdrops.example.atomdrops.model.enums.MediaType;
import atomdrops.example.atomdrops.model.enums.QuoteStatus;
import atomdrops.example.atomdrops.model.enums.RepairRequestStatus;
import atomdrops.example.atomdrops.model.enums.TechnicianLevel;
import atomdrops.example.atomdrops.repository.ReviewRepository;
import atomdrops.example.atomdrops.repository.RepairBookingRepository;
import atomdrops.example.atomdrops.repository.RepairMediaRepository;
import atomdrops.example.atomdrops.repository.RepairQuoteRepository;
import atomdrops.example.atomdrops.repository.RepairRequestRepository;
import atomdrops.example.atomdrops.repository.ServiceCompletionRepository;
import atomdrops.example.atomdrops.repository.TechnicianRepository;
import atomdrops.example.atomdrops.repository.UserRepository;
import atomdrops.example.atomdrops.web.dto.RepairBookingRequest;
import atomdrops.example.atomdrops.web.dto.RepairBookingResponse;
import atomdrops.example.atomdrops.web.dto.RepairQuoteRequest;
import atomdrops.example.atomdrops.web.dto.RepairQuoteResponse;
import atomdrops.example.atomdrops.web.dto.RepairRequestRequest;
import atomdrops.example.atomdrops.web.dto.RepairRequestResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RepairService {

    private final RepairRequestRepository repairRequestRepository;
    private final RepairMediaRepository repairMediaRepository;
    private final RepairQuoteRepository repairQuoteRepository;
    private final RepairBookingRepository repairBookingRepository;
    private final TechnicianRepository technicianRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ServiceCompletionRepository serviceCompletionRepository;
    private final TrustScoreService trustScoreService;

    public RepairService(
            RepairRequestRepository repairRequestRepository,
            RepairMediaRepository repairMediaRepository,
            RepairQuoteRepository repairQuoteRepository,
            RepairBookingRepository repairBookingRepository,
            TechnicianRepository technicianRepository,
            UserRepository userRepository,
            ReviewRepository reviewRepository,
            ServiceCompletionRepository serviceCompletionRepository,
            TrustScoreService trustScoreService) {
        this.repairRequestRepository = repairRequestRepository;
        this.repairMediaRepository = repairMediaRepository;
        this.repairQuoteRepository = repairQuoteRepository;
        this.repairBookingRepository = repairBookingRepository;
        this.technicianRepository = technicianRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.serviceCompletionRepository = serviceCompletionRepository;
        this.trustScoreService = trustScoreService;
    }

    @Transactional(readOnly = true)
    public List<RepairRequestResponse> getRequestsForCustomer(Long customerId) {
        return repairRequestRepository.findByCustomer_Id(customerId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RepairRequestResponse> getOpenRequests() {
        return repairRequestRepository.findByStatus(RepairRequestStatus.OPEN).stream().map(this::toResponse).toList();
    }

    public RepairRequestResponse createRequest(Long customerId, RepairRequestRequest request) {
        User customer = userRepository.findById(customerId)
            .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        RepairRequest rr = new RepairRequest();
        rr.setCustomer(customer);
        rr.setCategory(request.getCategory());
        rr.setDescription(request.getDescription());
        rr.setPickupNeeded(request.getPickupNeeded());
        rr.setStatus(RepairRequestStatus.OPEN);
        rr = repairRequestRepository.save(rr);

        if (request.getMedia() != null) {
            for (RepairRequestRequest.MediaItem item : request.getMedia()) {
                RepairMedia media = new RepairMedia();
                media.setRequest(rr);
                media.setMediaUrl(item.getUrl());
                media.setMediaType(MediaType.valueOf(item.getType().toUpperCase()));
                repairMediaRepository.save(media);
            }
        }

        return toResponse(rr);
    }

    public RepairQuoteResponse createQuote(Long technicianUserId, Long requestId, RepairQuoteRequest request) {
        Technician technician = technicianRepository.findByUser_Id(technicianUserId)
            .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        RepairRequest rr = repairRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Request not found"));

        RepairQuote quote = new RepairQuote();
        quote.setRequest(rr);
        quote.setTechnician(technician);
        quote.setQuoteBdt(request.getQuoteBdt());
        quote.setPlan(request.getPlan());
        quote.setStatus(QuoteStatus.SENT);
        quote = repairQuoteRepository.save(quote);

        rr.setStatus(RepairRequestStatus.QUOTED);
        repairRequestRepository.save(rr);

        return toQuoteResponse(quote);
    }

    public RepairBookingResponse acceptQuote(Long customerId, RepairBookingRequest request) {
        RepairQuote quote = repairQuoteRepository.findById(request.getQuoteId())
            .orElseThrow(() -> new IllegalArgumentException("Quote not found"));

        RepairRequest rr = quote.getRequest();
        if (!rr.getCustomer().getId().equals(customerId)) {
            throw new IllegalArgumentException("Unauthorized");
        }

        quote.setStatus(QuoteStatus.ACCEPTED);
        repairQuoteRepository.save(quote);

        RepairBooking booking = new RepairBooking();
        booking.setRequest(rr);
        booking.setTechnician(quote.getTechnician());
        booking.setScheduledDate(LocalDate.parse(request.getScheduledDate()));
        booking.setStatus(BookingStatus.CONFIRMED);
        booking = repairBookingRepository.save(booking);

        rr.setStatus(RepairRequestStatus.BOOKED);
        repairRequestRepository.save(rr);

        return toBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public List<RepairQuoteResponse> getQuotesForRequest(Long requestId) {
        return repairQuoteRepository.findByRequest_Id(requestId).stream().map(this::toQuoteResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RepairBookingResponse> getBookingsForTechnician(Long technicianUserId) {
        Technician technician = technicianRepository.findByUser_Id(technicianUserId)
            .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        return repairBookingRepository.findByTechnician_Id(technician.getId()).stream().map(this::toBookingResponse).toList();
    }

    public void rejectBooking(Long bookingId, Long userId) {
        RepairBooking booking = repairBookingRepository.findById(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (!booking.getTechnician().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Not the assigned technician");
        }
        booking.setStatus(BookingStatus.REJECTED);
        repairBookingRepository.save(booking);
        RepairRequest rr = booking.getRequest();
        rr.setStatus(RepairRequestStatus.OPEN);
        repairRequestRepository.save(rr);
    }

    public void completeBooking(Long bookingId, Long userId) {
        RepairBooking booking = repairBookingRepository.findById(bookingId)
            .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (!booking.getTechnician().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Not the assigned technician");
        }

        booking.setStatus(BookingStatus.COMPLETED);
        repairBookingRepository.save(booking);

        RepairRequest rr = booking.getRequest();
        rr.setStatus(RepairRequestStatus.COMPLETED);
        repairRequestRepository.save(rr);

        ServiceCompletion sc = new ServiceCompletion();
        sc.setBooking(booking);
        serviceCompletionRepository.save(sc);

        Technician tech = booking.getTechnician();
        java.util.List<RepairBooking> techBookings = repairBookingRepository.findByTechnician_Id(tech.getId());
        long completedCount = techBookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
        long totalCount = techBookings.size();
        if (totalCount > 0) {
            BigDecimal rate = BigDecimal.valueOf(completedCount).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalCount), 2, java.math.RoundingMode.HALF_UP);
            tech.setCompletionRate(rate);
        }
        if (completedCount >= 10 && tech.getLevel() == TechnicianLevel.VERIFIED) {
            tech.setLevel(TechnicianLevel.EXPERT);
        } else if (completedCount >= 5 && tech.getLevel() == TechnicianLevel.BEGINNER) {
            tech.setLevel(TechnicianLevel.VERIFIED);
        }
        technicianRepository.save(tech);

        trustScoreService.applyEvent(booking.getTechnician().getUser().getId(),
            "REPAIR_COMPLETED", new BigDecimal("3.00"));
    }

    public void submitReview(Long reviewerId, Long revieweeId, int rating, String comment) {
        User reviewer = userRepository.findById(reviewerId)
            .orElseThrow(() -> new IllegalArgumentException("Reviewer not found: " + reviewerId));
        User reviewee = userRepository.findById(revieweeId)
            .orElseThrow(() -> new IllegalArgumentException("Reviewee not found: " + revieweeId));

        boolean hasCompletedBooking = repairBookingRepository
            .existsByStatusAndRequest_Customer_IdAndTechnician_User_Id(
                BookingStatus.COMPLETED, reviewerId, revieweeId);
        if (!hasCompletedBooking) {
            throw new IllegalArgumentException("No completed repair between these users");
        }

        Review review = new Review();
        review.setReviewer(reviewer);
        review.setReviewee(reviewee);
        review.setRating(rating);
        review.setComment(comment);
        reviewRepository.save(review);
    }

    private RepairRequestResponse toResponse(RepairRequest rr) {
        RepairRequestResponse response = new RepairRequestResponse();
        response.setId(rr.getId());
        response.setCategory(rr.getCategory());
        response.setDescription(rr.getDescription());
        response.setPickupNeeded(rr.getPickupNeeded());
        response.setStatus(rr.getStatus().name());
        response.setCreatedAt(rr.getCreatedAt());

        if (rr.getCustomer() != null) {
            response.setCustomerId(rr.getCustomer().getId());
            response.setCustomerName(rr.getCustomer().getDisplayName());
        }

        List<RepairRequestResponse.MediaItem> media = new ArrayList<>();
        for (RepairMedia m : repairMediaRepository.findByRequest_Id(rr.getId())) {
            media.add(new RepairRequestResponse.MediaItem(m.getId(), m.getMediaUrl(), m.getMediaType().name()));
        }
        response.setMedia(media);

        repairBookingRepository.findFirstByRequest_IdOrderByUpdatedAtDesc(rr.getId())
            .ifPresent(booking -> response.setActiveBooking(toBookingResponse(booking)));

        return response;
    }

    private RepairQuoteResponse toQuoteResponse(RepairQuote quote) {
        RepairQuoteResponse response = new RepairQuoteResponse();
        response.setId(quote.getId());
        response.setRequestId(quote.getRequest().getId());
        response.setTechnicianId(quote.getTechnician().getId());
        response.setTechnicianName(quote.getTechnician().getUser().getDisplayName());
        response.setQuoteBdt(quote.getQuoteBdt());
        response.setPlan(quote.getPlan());
        response.setStatus(quote.getStatus().name());
        return response;
    }

    private RepairBookingResponse toBookingResponse(RepairBooking booking) {
        RepairBookingResponse response = new RepairBookingResponse();
        response.setId(booking.getId());
        response.setRequestId(booking.getRequest().getId());
        response.setTechnicianId(booking.getTechnician().getId());
        response.setTechnicianUserId(booking.getTechnician().getUser().getId());
        response.setScheduledDate(booking.getScheduledDate().toString());
        response.setStatus(booking.getStatus().name());
        return response;
    }
}
