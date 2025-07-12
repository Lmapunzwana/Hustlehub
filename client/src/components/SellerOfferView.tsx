
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, User, DollarSign, Package, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageCarousel from './ImageCarousel';

interface Offer {
  id: string;
  buyer_id: string;
  product_name: string;
  description: string;
  price: number;
  quantity: number;
  images: string[];
  location: { lat: number; lng: number };
  status: string;
  created_at: string;
  expires_at: string;
}

interface SellerOfferViewProps {
  offer: Offer;
  sellerId: string;
  onAccept: (offerId: string) => void;
  onCounter: (offerId: string, newPrice: number, message: string) => void;
  onReport: (offerId: string, reason: string, description: string) => void;
}

export default function SellerOfferView({ 
  offer, 
  sellerId, 
  onAccept, 
  onCounter, 
  onReport 
}: SellerOfferViewProps) {
  const [counterPrice, setCounterPrice] = useState(offer.price.toString());
  const [counterMessage, setCounterMessage] = useState('');
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const { toast } = useToast();

  const timeUntilExpiry = () => {
    const now = new Date();
    const expiry = new Date(offer.expires_at);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleAccept = () => {
    onAccept(offer.id);
    toast({
      title: "Offer Accepted",
      description: "Contact information will be shared with the buyer"
    });
  };

  const handleCounter = () => {
    const newPrice = parseFloat(counterPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return;
    }

    onCounter(offer.id, newPrice, counterMessage);
    toast({
      title: "Counter offer sent",
      description: "Your counter offer has been sent to the buyer"
    });
    setShowCounterForm(false);
  };

  const handleReport = () => {
    if (!reportReason || !reportDescription) {
      toast({
        title: "Missing information",
        description: "Please provide a reason and description",
        variant: "destructive"
      });
      return;
    }

    onReport(offer.id, reportReason, reportDescription);
    toast({
      title: "Report submitted",
      description: "Thank you for helping keep our marketplace safe"
    });
    setShowReportForm(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{offer.product_name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={offer.status === 'pending' ? 'default' : 'secondary'}>
                {offer.status}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {timeUntilExpiry()}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReportForm(true)}
            className="text-red-600 hover:text-red-700"
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Report
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Product Images */}
        {offer.images && offer.images.length > 0 && (
          <ImageCarousel images={offer.images} className="h-64" />
        )}

        {/* Offer Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium">Max Price:</span>
            <span className="text-lg font-bold text-green-600">${offer.price}</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="font-medium">Quantity:</span>
            <span>{offer.quantity}</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-gray-600">{offer.description}</p>
        </div>

        {/* Buyer Information */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4" />
            <span className="font-medium">Buyer Information</span>
          </div>
          <p className="text-sm text-gray-600">
            Buyer ID: {offer.buyer_id}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Location: {offer.location.lat.toFixed(4)}, {offer.location.lng.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {offer.status === 'pending' && (
          <div className="flex gap-3">
            <Button onClick={handleAccept} className="flex-1">
              Accept Offer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCounterForm(!showCounterForm)}
              className="flex-1"
            >
              Counter Offer
            </Button>
          </div>
        )}

        {/* Counter Offer Form */}
        {showCounterForm && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Submit Counter Offer</CardTitle>
              <p className="text-sm text-gray-600">
                You can only adjust the price. Quantity remains: {offer.quantity}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="Enter your price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message (optional)</label>
                <Textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Add a message to explain your counter offer..."
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCounter} size="sm">
                  Send Counter Offer
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowCounterForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Form */}
        {showReportForm && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-700">Report This Offer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <select 
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="prohibited_item">Prohibited Item</option>
                  <option value="spam">Spam</option>
                  <option value="misleading">Misleading Information</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide details about the issue..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleReport} 
                  variant="destructive" 
                  size="sm"
                >
                  Submit Report
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowReportForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
