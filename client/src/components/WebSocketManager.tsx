
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
  lastMessage: WebSocketMessage | null;
}

export function useWebSocket(clientId: string, userType: 'buyer' | 'seller' = 'buyer'): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const { toast } = useToast();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const wsUrl = `ws://localhost:8000/ws/${clientId}/${userType}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle different message types
          switch (message.type) {
            case 'new_offer':
              if (userType === 'seller') {
                toast({
                  title: "New Offer Available",
                  description: `${message.offer.product_name} - $${message.offer.price}`,
                });
              }
              break;
            case 'counter_offer':
              if (userType === 'buyer') {
                toast({
                  title: "Counter Offer Received",
                  description: `New price: $${message.counter_offer.new_price}`,
                });
              }
              break;
            case 'offer_accepted':
              toast({
                title: "Offer Accepted!",
                description: "Contact information has been shared.",
              });
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setSocket(ws);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [clientId, userType]);

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  };

  return {
    socket,
    isConnected,
    sendMessage,
    lastMessage,
  };
}

// Location tracking for sellers
export function useSellerLocationTracking(sellerId: string, sendMessage: (message: any) => void) {
  useEffect(() => {
    let watchId: number;

    const startTracking = () => {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            sendMessage({
              type: 'location_update',
              lat: latitude,
              lng: longitude,
              timestamp: new Date().toISOString()
            });
          },
          (error) => {
            console.error('Location tracking error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 60000,
            maximumAge: 30000
          }
        );
      }
    };

    // Send location every 30 seconds
    const interval = setInterval(startTracking, 30000);
    startTracking(); // Initial call

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearInterval(interval);
    };
  }, [sellerId, sendMessage]);
}
