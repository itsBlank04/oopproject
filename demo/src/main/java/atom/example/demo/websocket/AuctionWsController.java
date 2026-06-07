package atom.example.demo.websocket;

import atom.example.demo.model.Auction;
import atom.example.demo.model.AuctionLot;
import atom.example.demo.model.Bid;
import atom.example.demo.service.AuctionRealtimeService;
import atom.example.demo.service.BidService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * WebSocket controller handling real‑time auction interactions.
 *
 * Clients send messages to "/app/bid.place" with a JSON payload of type {@link BidPlaceMessage}.
 * On success the server broadcasts a {@link BidPlacedMessage} to the topic "/topic/auction.{auctionId}".
 * Errors are sent back to the client as a {@link ErrorMessage}.
 */
@Controller
public class AuctionWsController {

    private final BidService bidService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuctionRealtimeService realtimeService;

    @Autowired
    public AuctionWsController(BidService bidService,
                               SimpMessagingTemplate messagingTemplate,
                               AuctionRealtimeService realtimeService) {
        this.bidService = bidService;
        this.messagingTemplate = messagingTemplate;
        this.realtimeService = realtimeService;
    }

    @MessageMapping("bid.place")
    public void placeBid(@Payload BidPlaceMessage msg) {
        try {
            Bid bid = bidService.placeBid(msg.getLotId(), msg.getBidderId(), msg.getAmount());
            // Broadcast to all subscribers of this auction.
            BidPlacedMessage out = new BidPlacedMessage();
            out.setAuctionId(bid.getLot().getAuction().getId());
            out.setLotId(bid.getLot().getId());
            out.setBidId(bid.getId());
            out.setAmount(bid.getAmountBdt());
            out.setBidderId(bid.getBidder().getId());
            out.setTimestamp(bid.getCreatedAt().toString());
            messagingTemplate.convertAndSend("/topic/auction." + out.getAuctionId(), out);
        } catch (Exception e) {
            ErrorMessage err = new ErrorMessage();
            err.setMessage(e.getMessage());
            messagingTemplate.convertAndSendToUser(msg.getSessionId(), "/queue/errors", err);
        }
    }
}

// DTOs used for WebSocket communication
class BidPlaceMessage {
    private Long auctionId;
    private Long lotId;
    private Long bidderId;
    private BigDecimal amount;
    private String sessionId; // used for private error queue
    public Long getAuctionId() { return auctionId; }
    public void setAuctionId(Long auctionId) { this.auctionId = auctionId; }
    public Long getLotId() { return lotId; }
    public void setLotId(Long lotId) { this.lotId = lotId; }
    public Long getBidderId() { return bidderId; }
    public void setBidderId(Long bidderId) { this.bidderId = bidderId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
}

class BidPlacedMessage {
    private Long auctionId;
    private Long lotId;
    private Long bidId;
    private BigDecimal amount;
    private Long bidderId;
    private String timestamp;
    public Long getAuctionId() { return auctionId; }
    public void setAuctionId(Long auctionId) { this.auctionId = auctionId; }
    public Long getLotId() { return lotId; }
    public void setLotId(Long lotId) { this.lotId = lotId; }
    public Long getBidId() { return bidId; }
    public void setBidId(Long bidId) { this.bidId = bidId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Long getBidderId() { return bidderId; }
    public void setBidderId(Long bidderId) { this.bidderId = bidderId; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}

class ErrorMessage {
    private String message;
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
