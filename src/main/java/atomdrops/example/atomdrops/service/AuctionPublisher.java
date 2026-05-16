package atomdrops.example.atomdrops.service;

import atomdrops.example.atomdrops.web.dto.BidResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class AuctionPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public AuctionPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishBid(Long lotId, BidResponse bid) {
        messagingTemplate.convertAndSend("/topic/lots/" + lotId + "/bids", bid);
    }

    public void publishLotUpdate(Long lotId, Object lotData) {
        messagingTemplate.convertAndSend("/topic/lots/" + lotId, lotData);
    }
}
