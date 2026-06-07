import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Client } from '@stomp/stompjs';

/**
 * Hook to manage a WebSocket (STOMP) connection for a specific auction.
 * It replaces the previous EventSource implementation.
 *
 * @param auctionId Id of the auction to subscribe to.
 * @param onError optional error callback.
 */
export function useAuctionWebSocket(auctionId: string | undefined, onError?: (msg: string) => void) {
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    const wsBase = import.meta.env.VITE_API_URL?.replace(/^http/, 'ws') || 'ws://localhost:8080';
    const client = new Client({
      brokerURL: `${wsBase}/ws/auction`,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    client.onConnect = () => {
      // Subscribe to the auction topic
      client.subscribe(`/topic/auction.${auctionId}`, (msg) => {
        try {
          const payload = JSON.parse(msg.body);
          // Invalidate relevant queries so UI refreshes
          queryClient.invalidateQueries({ queryKey: ['auction', auctionId] });
          queryClient.invalidateQueries({ queryKey: ['auction-bids', auctionId] });
          queryClient.invalidateQueries({ queryKey: ['auction-my-wins'] });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          // Show toast for bid events (if payload contains bid info)
          if (payload.amountBdt && payload.bidderId) {
            toast.success(`New bid: BDT ${payload.amountBdt}`);
          }
        } catch (e) {
          // ignore malformed messages
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ', frame.headers['message']);
      if (onError) onError(frame.headers['message'] ?? 'WebSocket error');
    };

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [auctionId, queryClient, onError]);

  // Helper to send a bid placement over the socket
  const placeBid = (lotId: number, bidderId: number, amount: number) => {
    const client = clientRef.current;
    if (!client || !client.connected) {
      toast.error('Not connected to auction server');
      return;
    }
    const msg = {
      auctionId: Number(auctionId),
      lotId,
      bidderId,
      amount: amount,
      sessionId: client.connected ? client.ws?.protocol : undefined,
    };
    client.publish({ destination: '/app/bid.place', body: JSON.stringify(msg) });
  };

  return { placeBid, client: clientRef.current };
}
