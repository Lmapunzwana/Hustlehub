import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Map from "@/components/Map";
import ExpandableModal from "@/components/ExpandableModal";
import SellersView from "@/components/SellersView";
import BuyerRequestForm from "@/components/BuyerRequestForm";
import RequestActiveView from "@/components/RequestActiveView";
import OfferAcceptedView from "@/components/OfferAcceptedView";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/use-toast";
import { LocateIcon, RefreshCwIcon, WifiIcon } from "lucide-react";
import type { SellerWithDistance, Category, RequestWithOffers, Order } from "@shared/schema";

type ViewType = 'sellers' | 'buyerRequest' | 'requestActive' | 'offerAccepted';

export default function MapPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'sellers' | 'create-offer' | 'view-offers'>('sellers');
  const [userType, setUserType] = useState<'buyer' | 'seller'>('buyer');
  const [hoveredSeller, setHoveredSeller] = useState<SellerWithDistance | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { location, error: locationError, isLoading: locationLoading, requestLocation } = useGeolocation();
  const { toast } = useToast();

  // WebSocket connection
  const clientId = `user_${Math.random().toString(36).substr(2, 9)}`;
  // const { isConnected, sendMessage, lastMessage } = useWebSocket(clientId, userType); // Assuming useWebSocket hook is available

  // Location tracking for sellers
  // useSellerLocationTracking(clientId, sendMessage); // Assuming useSellerLocationTracking hook is available

  // Fetch nearby sellers
  const { data: sellers = [], isLoading: sellersLoading, refetch: refetchSellers } = useQuery({
    queryKey: ["sellers", location?.lat, location?.lng],
    queryFn: async () => {
      if (!location) return [];

      const response = await fetch(`http://localhost:8000/api/sellers/nearby?lat=${location.lat}&lng=${location.lng}&radius=5`);
      if (!response.ok) throw new Error('Failed to fetch sellers');
      return response.json();
    },
    enabled: !!location,
    refetchInterval: 5000,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const handleLocateUser = () => {
    if (location) {
      // Map will automatically center on user location via prop
      toast({
        title: "Location updated",
        description: "Centered on your current location",
      });
    } else {
      requestLocation();
    }
  };

  const handleRefresh = () => {
    refetchSellers();
    toast({
      title: "Refreshing",
      description: "Finding nearby sellers...",
    });
  };

  // Mouse tracking for hover cards
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Handle WebSocket messages
  // useEffect(() => {
  //   if (lastMessage) {
  //     console.log('Received WebSocket message:', lastMessage);
  //   }
  // }, [lastMessage]);

  const handleCreateOffer = () => {
    setCurrentView('create-offer');
    setIsModalOpen(true);
  };

  // const handleOfferSubmit = (offerData: any) => {
  //   console.log('Offer created:', offerData);
  //   setIsModalOpen(false);
  //   setCurrentView('sellers');
  // };

  const handleOfferSubmit = (offerData: any) => {
    console.log('Offer created:', offerData);
    setIsModalOpen(false);
    setCurrentView('sellers');
  };

  const handleAcceptOffer = (offerId: string) => {
    // Implementation for accepting offers
    console.log('Accepting offer:', offerId);
  };

  const handleCounterOffer = (offerId: string, newPrice: number, message: string) => {
    // Implementation for counter offers
    console.log('Counter offer:', { offerId, newPrice, message });
  };

  const handleReportOffer = (offerId: string, reason: string, description: string) => {
    // Implementation for reporting
    console.log('Reporting offer:', { offerId, reason, description });
  };


  const getModalTitle = () => {
    switch (currentView) {
      case 'sellers':
        return 'Find Local Sellers';
      case 'buyerRequest':
        return 'Post Request';
      case 'requestActive':
        return 'Request Active';
      case 'offerAccepted':
        return 'Order Details';
      default:
        return 'MapMarket';
    }
  };

  const renderModalContent = () => {
    switch (currentView) {
      case 'sellers':
        return (
          <SellersView
            sellers={sellers}
            isLoading={sellersLoading}
            onCreateRequest={handleCreateOffer}
          />
        );
      case 'buyerRequest':
        return (
          <BuyerRequestForm
            categories={categories}
            userLocation={location}
          />
        );
      case 'requestActive':
        return activeRequest ? (
          <RequestActiveView
            request={activeRequest}
            onOfferAccepted={handleAcceptOffer}
          />
        ) : null;
      case 'offerAccepted':
        return acceptedOrder ? (
          <OfferAcceptedView
            order={acceptedOrder}
          />
        ) : null;
      default:
        return null;
    }
  };

  // Handle location errors
  useEffect(() => {
    if (locationError) {
      toast({
        title: "Location Error",
        description: locationError,
        variant: "destructive",
      });
    }
  }, [locationError, toast]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Map Container */}
      <Map
        sellers={sellers}
        userLocation={location}
        className="w-full h-full z-0"
        onSellerHover={setHoveredSeller}
      />

      {/* Seller hover card */}
      {/* <SellerHoverCard
        seller={hoveredSeller}
        position={mousePosition}
      /> */}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* WebSocket Status */}
        {/* <div className={`px-2 py-1 rounded text-xs font-medium ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <WifiIcon className="h-3 w-3 inline mr-1" />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div> */}

        {/* User Type Toggle */}
        <div className="bg-white rounded-lg shadow-md p-1 flex">
          <button
            onClick={() => setUserType('buyer')}
            className={`px-3 py-1 text-xs rounded ${
              userType === 'buyer'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Buyer
          </button>
          <button
            onClick={() => setUserType('seller')}
            className={`px-3 py-1 text-xs rounded ${
              userType === 'seller'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Seller
          </button>
        </div>

        <Button
          size="icon"
          variant="secondary"
          onClick={handleLocateUser}
          className="bg-white hover:bg-gray-50 shadow-lg"
        >
          <LocateIcon className="h-4 w-4 text-primary" />
        </Button>
        <Button
          size="icon"
          variant="secondary"
          onClick={handleRefresh}
          className="bg-white hover:bg-gray-50 shadow-lg"
        >
          <RefreshCwIcon className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      {/* Expandable Modal */}
      <ExpandableModal
        title={getModalTitle()}
        isExpanded={isModalOpen}
        onExpandedChange={setIsModalOpen}
      >
        {renderModalContent()}
      </ExpandableModal>
    </div>
  );
}