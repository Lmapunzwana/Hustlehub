import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { usePolling } from '@/hooks/usePolling';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeftIcon, ClockIcon, EyeIcon, UserIcon, PhoneIcon } from 'lucide-react';
import type { RequestWithOffers, Order, OfferWithSeller, Seller } from '@shared/schema';

interface RequestActiveViewProps {
  request: RequestWithOffers;
  onOfferAccepted: (order: Order) => void;
  onBack: () => void;
}

export default function RequestActiveView({
  request,
  onOfferAccepted,
  onBack,
}: RequestActiveViewProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [offers, setOffers] = useState<OfferWithSeller[]>(request.offers || []);
  const [viewers, setViewers] = useState<Seller[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate initial time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const expiresAt = new Date(request.expiresAt);
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);
      return remaining;
    };

    calculateTimeRemaining();
    
    const timer = setInterval(() => {
      const remaining = calculateTimeRemaining();
      if (remaining <= 0) {
        clearInterval(timer);
        toast({
          title: 'Request Expired',
          description: 'Your request has expired. You can create a new one.',
          variant: 'destructive',
        });
        onBack();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [request.expiresAt, onBack, toast]);

  // Poll for new offers
  const { data: newOffers } = usePolling<OfferWithSeller[]>({
    queryKey: [`/api/requests/${request.id}/offers`],
    interval: 1000, // Poll every second
    enabled: timeRemaining > 0,
  });

  // Poll for viewers
  const { data: newViewers } = usePolling<Seller[]>({
    queryKey: [`/api/requests/${request.id}/viewers`],
    interval: 2000, // Poll every 2 seconds for viewers
    enabled: timeRemaining > 0,
  });

  // Update offers when new data arrives
  useEffect(() => {
    if (newOffers) {
      setOffers(newOffers);
    }
  }, [newOffers]);

  // Update viewers when new data arrives
  useEffect(() => {
    if (newViewers) {
      setViewers(newViewers);
    }
  }, [newViewers]);

  const acceptOfferMutation = useMutation({
    mutationFn: async (offerId: number) => {
      const response = await apiRequest('PATCH', `/api/offers/${offerId}/accept`);
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'Offer Accepted!',
        description: 'You can now contact the seller',
      });
      onOfferAccepted(data.order);
    },
    onError: (error) => {
      console.error('Error accepting offer:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept offer. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalTime = 5 * 60; // 5 minutes in seconds
    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  const formatPrice = (price: string | number) => {
    return `$${parseFloat(price.toString()).toFixed(2)}`;
  };

  return (
    <div className="p-4 space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="flex items-center text-primary text-sm font-medium mb-4 -ml-2"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to sellers
      </Button>

      {/* Timer Section */}
      <div className="text-center">
        <div className="mb-4">
          <div className="relative inline-block">
            <svg className="progress-ring w-20 h-20" viewBox="0 0 90 90">
              <circle
                className="text-gray-200"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                r="40"
                cx="45"
                cy="45"
              />
              <circle
                className="progress-ring-circle text-warning"
                stroke="currentColor"
                strokeWidth="6"
                fill="transparent"
                r="40"
                cx="45"
                cy="45"
                style={{
                  strokeDashoffset: 251.2 - (getProgressPercentage() / 100) * 251.2,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-gray-900">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Active</h3>
        <p className="text-sm text-gray-600 mb-4">Waiting for seller offers...</p>
      </div>

      {/* Request Summary */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Your Request</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="text-gray-900">{request.category?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Max Price:</span>
            <span className="text-gray-900">{formatPrice(request.maxPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Description:</span>
            <span className="text-gray-900 text-right flex-1 ml-2">
              {request.description}
            </span>
          </div>
          {request.imageUrl && (
            <div className="mt-3">
              <img
                src={request.imageUrl}
                alt="Request"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Auto-Accept Status */}
      {request.autoAcceptEnabled && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-blue-800">
              Auto-Accept enabled for offers ≤ {formatPrice(request.autoAcceptPrice || 0)}
            </span>
          </div>
        </Card>
      )}

      {/* Currently Viewing */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <EyeIcon className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Sellers Viewing</h4>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {viewers.length} viewing
          </Badge>
        </div>
        
        {viewers.length === 0 ? (
          <p className="text-sm text-gray-500">No sellers viewing yet</p>
        ) : (
          <div className="flex -space-x-2">
            {viewers.slice(0, 5).map((viewer) => (
              <Avatar key={viewer.id} className="w-8 h-8 border-2 border-white">
                <AvatarImage src={viewer.profileImageUrl || ''} alt={viewer.name} />
                <AvatarFallback className="text-xs">
                  {viewer.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {viewers.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">+{viewers.length - 5}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Demo Buttons for Testing */}
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-3">Demo Actions</h4>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              fetch(`/api/demo/create-offers/${request.id}`, { method: 'POST' })
                .then(() => toast({
                  title: "Demo offers created",
                  description: "Sample offers have been added to your request"
                }));
            }}
          >
            Add Sample Offers
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              fetch(`/api/demo/add-viewers/${request.id}`, { method: 'POST' })
                .then(() => toast({
                  title: "Demo viewers added",
                  description: "Sample sellers are now viewing your request"
                }));
            }}
          >
            Add Viewers
          </Button>
        </div>
      </Card>

      {/* Live Offers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Live Offers</h4>
          <Badge variant="secondary">
            {offers.length} offer{offers.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="space-y-3">
          {offers.length === 0 ? (
            <Card className="p-6 text-center">
              <ClockIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No offers yet</p>
              <p className="text-sm text-gray-400">Sellers will see your request and respond</p>
            </Card>
          ) : (
            offers.map((offer) => (
              <Card key={offer.id} className="p-4">
                <div className="flex items-start space-x-3">
                  {offer.seller.profileImageUrl ? (
                    <img
                      src={offer.seller.profileImageUrl}
                      alt={offer.seller.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">
                        {offer.seller.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">
                        {offer.seller.name}
                      </span>
                      <span className="font-bold text-green-600">
                        {formatPrice(offer.price)}
                      </span>
                    </div>
                    
                    {offer.message && (
                      <p className="text-sm text-gray-600 mb-3">{offer.message}</p>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => acceptOfferMutation.mutate(offer.id)}
                        disabled={acceptOfferMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-700"
                      >
                        Counter
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
