package atom.example.demo.service;

import atom.example.demo.model.Auction;
import atom.example.demo.model.AuctionLot;
import atom.example.demo.model.Bid;
import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class AuctionRealtimeService {

    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emittersByAuction = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long auctionId) {
        SseEmitter emitter = new SseEmitter(0L);
        emittersByAuction.computeIfAbsent(auctionId, key -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> removeEmitter(auctionId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(error -> cleanup.run());

        Map<String, Object> payload = new HashMap<>();
        payload.put("auctionId", auctionId);
        payload.put("serverTime", Instant.now().toString());
        send(emitter, "connected", payload);
        return emitter;
    }

    public void broadcastAuction(Auction auction, String eventName) {
        if (auction == null || auction.getId() == null) return;
        Map<String, Object> payload = new HashMap<>();
        payload.put("auctionId", auction.getId());
        payload.put("status", auction.getStatus());
        payload.put("startTime", auction.getStartTime());
        payload.put("endTime", auction.getEndTime());
        payload.put("serverTime", Instant.now().toString());
        broadcast(auction.getId(), eventName, payload);

    }

    public void broadcastLot(AuctionLot lot, Bid bid, String eventName) {
        if (lot == null || lot.getAuction() == null || lot.getAuction().getId() == null) return;
        Map<String, Object> payload = new HashMap<>();
        payload.put("auctionId", lot.getAuction().getId());
        payload.put("lotId", lot.getId());
        payload.put("status", lot.getStatus());
        payload.put("currentBidBdt", lot.getCurrentBidBdt());
        payload.put("extensionsCount", lot.getExtensionsCount());
        payload.put("auctionEndTime", lot.getAuction().getEndTime());
        payload.put("serverTime", Instant.now().toString());
        if (bid != null) {
            payload.put("bidId", bid.getId());
            payload.put("amountBdt", bid.getAmountBdt());
            payload.put("bidderId", bid.getBidder() != null ? bid.getBidder().getId() : null);
        }
        broadcast(lot.getAuction().getId(), eventName, payload);
    }

    private void broadcast(Long auctionId, String eventName, Map<String, Object> payload) {
        List<SseEmitter> emitters = emittersByAuction.get(auctionId);
        if (emitters == null || emitters.isEmpty()) return;
        for (SseEmitter emitter : emitters) {
            send(emitter, eventName, payload);
        }
    }

    private void send(SseEmitter emitter, String eventName, Map<String, Object> payload) {
        try {
            emitter.send(SseEmitter.event().name(eventName).data(payload));
        } catch (IOException | IllegalStateException ex) {
            emittersByAuction.values().forEach(list -> list.remove(emitter));
        }
    }

    private void removeEmitter(Long auctionId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersByAuction.get(auctionId);
        if (emitters == null) return;
        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByAuction.remove(auctionId);
        }
    }
}
