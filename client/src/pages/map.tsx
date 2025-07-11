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
import { LocateIcon, RefreshCwIcon } from "lucide-react";
import type { SellerWithDistance, Category, RequestWithOffers, Order } from "@shared/schema";

type ViewType = 'sellers' | 'buyerRequest' | 'requestActive' | 'offerAccepted';

export default function MapPage() {
  const [currentView, setCurrentView] = useState<ViewType>('sellers');
  const [isModalExpanded, setIsModalExpanded] = useState(false);
  const [activeRequest, setActiveRequest] = useState<RequestWithOffers | null>(null);
  const [acceptedOrder, setAcceptedOrder] = useState<Order | null>(null);
  const { location, error: locationError, requestLocation } = useGeolocation();
  const { toast } = useToast();

  // Fetch nearby sellers
  const { data: sellers = [], isLoading: sellersLoading, refetch: refetchSellers } = useQuery({
    queryKey: ['/api/sellers', location?.lat, location?.lng],
    enabled: !!location,
    refetchInterval: 5000, // Refresh every 5 seconds
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

  const handleCreateRequest = () => {
    setCurrentView('buyerRequest');
    setIsModalExpanded(true);
  };

  const handleBackToSellers = () => {
    setCurrentView('sellers');
    setActiveRequest(null);
  };

  const handleRequestSubmitted = (request: RequestWithOffers) => {
    setActiveRequest(request);
    setCurrentView('requestActive');
  };

  const handleOfferAccepted = (order: Order) => {
    setAcceptedOrder(order);
    setCurrentView('offerAccepted');
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
            onCreateRequest={handleCreateRequest}
          />
        );
      case 'buyerRequest':
        return (
          <BuyerRequestForm
            categories={categories}
            userLocation={location}
            onBack={handleBackToSellers}
            onRequestSubmitted={handleRequestSubmitted}
          />
        );
      case 'requestActive':
        return activeRequest ? (
          <RequestActiveView
            request={activeRequest}
            onOfferAccepted={handleOfferAccepted}
            onBack={handleBackToSellers}
          />
        ) : null;
      case 'offerAccepted':
        return acceptedOrder ? (
          <OfferAcceptedView
            order={acceptedOrder}
            onBack={handleBackToSellers}
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
      />

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
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
        isExpanded={isModalExpanded}
        onExpandedChange={setIsModalExpanded}
      >
        {renderModalContent()}
      </ExpandableModal>
    </div>
  );
}
