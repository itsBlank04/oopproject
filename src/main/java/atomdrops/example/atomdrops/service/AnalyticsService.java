package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.model.Auction;
import atomdrops.example.atomdrops.model.AuctionLot;
import atomdrops.example.atomdrops.model.Bid;
import atomdrops.example.atomdrops.model.Order;
import atomdrops.example.atomdrops.model.Product;
import atomdrops.example.atomdrops.model.RepairBooking;
import atomdrops.example.atomdrops.model.Return;
import atomdrops.example.atomdrops.model.Technician;
import atomdrops.example.atomdrops.model.enums.AuctionStatus;
import atomdrops.example.atomdrops.model.enums.BookingStatus;
import atomdrops.example.atomdrops.model.enums.FraudFlagStatus;
import atomdrops.example.atomdrops.model.enums.ReturnStatus;
import atomdrops.example.atomdrops.repository.*;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionLotRepository auctionLotRepository;
    private final BidRepository bidRepository;
    private final RepairBookingRepository repairBookingRepository;
    private final TechnicianRepository technicianRepository;
    private final UserRepository userRepository;
    private final FraudFlagRepository fraudFlagRepository;
    private final ReturnRepository returnRepository;

    public AnalyticsService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            AuctionRepository auctionRepository,
            AuctionLotRepository auctionLotRepository,
            BidRepository bidRepository,
            RepairBookingRepository repairBookingRepository,
            TechnicianRepository technicianRepository,
            UserRepository userRepository,
            FraudFlagRepository fraudFlagRepository,
            ReturnRepository returnRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.auctionRepository = auctionRepository;
        this.auctionLotRepository = auctionLotRepository;
        this.bidRepository = bidRepository;
        this.repairBookingRepository = repairBookingRepository;
        this.technicianRepository = technicianRepository;
        this.userRepository = userRepository;
        this.fraudFlagRepository = fraudFlagRepository;
        this.returnRepository = returnRepository;
    }

    public Map<String, Object> getAuctionAnalytics(Long auctionId) {
        Map<String, Object> stats = new HashMap<>();
        Auction auction = auctionRepository.findById(auctionId)
            .orElseThrow(() -> new IllegalArgumentException("Auction not found: " + auctionId));
        List<AuctionLot> lots = auctionLotRepository.findByAuction_Id(auctionId);
        stats.put("totalLots", (long) lots.size());

        long totalBids = 0;
        Set<Long> uniqueBidders = new HashSet<>();
        BigDecimal highestBid = BigDecimal.ZERO;

        for (AuctionLot lot : lots) {
            List<Bid> bids = bidRepository.findByLot_IdOrderByAmountBdtDesc(lot.getId());
            totalBids += bids.size();
            for (Bid bid : bids) {
                uniqueBidders.add(bid.getBidder().getId());
                if (bid.getAmountBdt().compareTo(highestBid) > 0) {
                    highestBid = bid.getAmountBdt();
                }
            }
        }

        stats.put("totalBids", totalBids);
        stats.put("uniqueBidders", (long) uniqueBidders.size());
        stats.put("highestBidBdt", highestBid);
        stats.put("reservePriceBdt", auction.getReservePriceBdt());
        stats.put("reserveMet", auction.getReservePriceBdt() != null
            && highestBid.compareTo(auction.getReservePriceBdt()) >= 0);
        return stats;
    }

    public Map<String, Object> getVendorAnalytics(Long vendorId) {
        Map<String, Object> stats = new HashMap<>();
        List<Product> products = productRepository.findByVendor_Id(vendorId, org.springframework.data.domain.Pageable.unpaged()).getContent();
        stats.put("totalProducts", (long) products.size());

        List<Order> allOrders = orderRepository.findAll();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalOrders = 0;
        for (Order order : allOrders) {
            boolean belongsToVendor = order.getItems().stream()
                .anyMatch(item -> item.getProduct().getVendor() != null
                    && item.getProduct().getVendor().getId().equals(vendorId));
            if (belongsToVendor) {
                totalOrders++;
                if (order.getTotalBdt() != null) {
                    totalRevenue = totalRevenue.add(order.getTotalBdt());
                }
            }
        }
        stats.put("totalOrders", totalOrders);
        stats.put("totalRevenue", totalRevenue);

        List<Auction> auctions = auctionRepository.findByVendor_Id(vendorId);
        stats.put("totalAuctions", (long) auctions.size());
        stats.put("activeAuctions", auctions.stream().filter(a -> a.getStatus() == AuctionStatus.ACTIVE).count());
        return stats;
    }

    public Map<String, Object> getAdminAnalytics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalProducts", productRepository.count());
        stats.put("openFraudFlags", (long) fraudFlagRepository.findByStatus(FraudFlagStatus.OPEN).size());
        List<Return> allReturns = returnRepository.findAll();
        stats.put("openReturns", allReturns.stream().filter(r -> r.getStatus() == ReturnStatus.OPEN).count());
        stats.put("totalAuctions", auctionRepository.count());

        // Total revenue
        BigDecimal totalRevenue = BigDecimal.ZERO;
        for (Order order : orderRepository.findAll()) {
            if (order.getTotalBdt() != null) {
                totalRevenue = totalRevenue.add(order.getTotalBdt());
            }
        }
        stats.put("totalRevenue", totalRevenue);

        // Active auctions
        stats.put("activeAuctions", (long) auctionRepository.findByStatus(AuctionStatus.ACTIVE).size());

        return stats;
    }

    public List<Map<String, Object>> getAdminRevenueTrend() {
        List<Map<String, Object>> trend = new java.util.ArrayList<>();
        Map<String, BigDecimal> monthlyRevenue = new java.util.TreeMap<>();

        for (Order order : orderRepository.findAll()) {
            if (order.getTotalBdt() != null && order.getCreatedAt() != null) {
                String month = order.getCreatedAt().toString().substring(0, 7); // YYYY-MM
                monthlyRevenue.merge(month, order.getTotalBdt(), BigDecimal::add);
            }
        }

        for (Map.Entry<String, BigDecimal> entry : monthlyRevenue.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", entry.getKey());
            point.put("revenue", entry.getValue());
            trend.add(point);
        }
        return trend;
    }

    public List<Map<String, Object>> getUserGrowth() {
        List<Map<String, Object>> growth = new java.util.ArrayList<>();
        Map<String, Long> monthlyUsers = new java.util.TreeMap<>();

        for (var user : userRepository.findAll()) {
            if (user.getCreatedAt() != null) {
                String month = user.getCreatedAt().toString().substring(0, 7);
                monthlyUsers.merge(month, 1L, Long::sum);
            }
        }

        for (Map.Entry<String, Long> entry : monthlyUsers.entrySet()) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", entry.getKey());
            point.put("count", entry.getValue());
            growth.add(point);
        }
        return growth;
    }

    public Map<String, Object> getTechnicianAnalytics(Long technicianUserId) {
        Map<String, Object> stats = new HashMap<>();
        Technician technician = technicianRepository.findByUser_Id(technicianUserId)
            .orElseThrow(() -> new IllegalArgumentException("Technician not found"));
        List<RepairBooking> bookings = repairBookingRepository.findByTechnician_Id(technician.getId());
        long totalBookings = bookings.size();
        long completedBookings = bookings.stream().filter(b -> b.getStatus() == BookingStatus.COMPLETED).count();
        stats.put("totalBookings", totalBookings);
        stats.put("completedBookings", completedBookings);
        stats.put("completionRate", totalBookings > 0
            ? BigDecimal.valueOf(completedBookings).multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalBookings), 2, java.math.RoundingMode.HALF_UP)
            : BigDecimal.ZERO);
        return stats;
    }
}
