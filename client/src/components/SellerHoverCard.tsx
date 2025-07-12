
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarIcon, MapPinIcon, WifiIcon, WifiOffIcon } from 'lucide-react';
import type { SellerWithDistance } from '@shared/schema';

interface SellerHoverCardProps {
  seller: SellerWithDistance | null;
  position: { x: number; y: number };
}

export default function SellerHoverCard({ seller, position }: SellerHoverCardProps) {
  if (!seller) return null;

  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x + 10,
        top: position.y - 100,
        maxWidth: '250px'
      }}
    >
      <Card className="shadow-lg border-2">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {seller.profileImageUrl ? (
                <img
                  src={seller.profileImageUrl}
                  alt={seller.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium text-sm">
                    {seller.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                seller.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{seller.name}</div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex items-center text-yellow-400">
                  <StarIcon className="w-3 h-3 fill-current" />
                  <span className="text-xs ml-1">{seller.rating}</span>
                </div>
                <Badge variant={seller.isOnline ? "default" : "secondary"} className="text-xs px-1 py-0">
                  {seller.isOnline ? (
                    <WifiIcon className="w-2 h-2 mr-1" />
                  ) : (
                    <WifiOffIcon className="w-2 h-2 mr-1" />
                  )}
                  {seller.isOnline ? 'Online' : 'Away'}
                </Badge>
              </div>
              
              <div className="flex items-center text-gray-500 mt-1">
                <MapPinIcon className="w-3 h-3 mr-1" />
                <span className="text-xs">
                  {seller.distance ? `${seller.distance.toFixed(1)} km away` : 'Distance unknown'}
                </span>
              </div>
              
              {/* Primary category if available */}
              <div className="text-xs text-gray-600 mt-1">
                Food & Groceries {/* This would come from seller data */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
