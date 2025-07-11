import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeftIcon, CheckCircleIcon, PhoneIcon, MessageCircleIcon } from 'lucide-react';
import { useState } from 'react';
import type { Order, Seller } from '@shared/schema';

interface OfferAcceptedViewProps {
  order: Order;
  onBack: () => void;
}

export default function OfferAcceptedView({ order, onBack }: OfferAcceptedViewProps) {
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const { toast } = useToast();

  // For demo purposes, we'll mock the seller data since we don't have relations set up
  const mockSeller: Seller = {
    id: 1,
    name: "John Mukamuri",
    phone: "+263 77 123 4567",
    whatsapp: "+263 77 123 4567",
    latitude: "-17.8201",
    longitude: "31.0369",
    rating: "4.8",
    isOnline: true,
    lastSeen: new Date(),
    profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=96&h=96&fit=crop&crop=face"
  };

  const handleCall = () => {
    window.open(`tel:${mockSeller.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hi ${mockSeller.name}, I accepted your offer for $${order.finalPrice}. Let's arrange the details!`);
    window.open(`https://wa.me/${mockSeller.whatsapp?.replace(/[^\d]/g, '')}?text=${message}`, '_blank');
  };

  const handleConfirmOrder = () => {
    toast({
      title: 'Order Confirmed!',
      description: `Your order has been confirmed with ${deliveryOption} delivery option.`,
    });
    
    // In a real app, you would update the order status here
    setTimeout(() => {
      onBack();
    }, 2000);
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

      {/* Success Message */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Offer Accepted!</h3>
        <p className="text-sm text-gray-600">You can now contact the seller</p>
      </div>

      {/* Order Summary */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Final Price:</span>
            <span className="font-semibold text-gray-900">{formatPrice(order.finalPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Order ID:</span>
            <span className="text-gray-900">#{order.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="text-green-600 font-medium">Confirmed</span>
          </div>
        </div>
      </Card>

      {/* Seller Contact Details */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Seller Contact</h4>
        
        <div className="flex items-center space-x-3 mb-4">
          {mockSeller.profileImageUrl ? (
            <img
              src={mockSeller.profileImageUrl}
              alt={mockSeller.name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {mockSeller.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{mockSeller.name}</div>
            <div className="text-sm text-gray-600">⭐ {mockSeller.rating} rating</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <PhoneIcon className="w-4 h-4 text-primary" />
              <span className="text-gray-900">{mockSeller.phone}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCall}
              className="text-primary border-primary hover:bg-primary hover:text-white"
            >
              Call
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <MessageCircleIcon className="w-4 h-4 text-green-600" />
              <span className="text-gray-900">WhatsApp</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
            >
              Message
            </Button>
          </div>
        </div>
      </Card>

      {/* Delivery Options */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Delivery Options</h4>
        <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pickup" id="pickup" />
            <Label htmlFor="pickup" className="flex-1 cursor-pointer">
              Pickup from seller (Free)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="delivery" id="delivery" />
            <Label htmlFor="delivery" className="flex-1 cursor-pointer">
              Home delivery (+$2.00)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="meet_halfway" id="meet_halfway" />
            <Label htmlFor="meet_halfway" className="flex-1 cursor-pointer">
              Meet halfway (Free)
            </Label>
          </div>
        </RadioGroup>
      </Card>

      <Button
        onClick={handleConfirmOrder}
        className="w-full bg-primary text-white hover:bg-primary/90"
      >
        Confirm Order
      </Button>
    </div>
  );
}
