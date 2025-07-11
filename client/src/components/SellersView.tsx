import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarIcon, WifiIcon, WifiOffIcon } from 'lucide-react';
import type { SellerWithDistance } from '@shared/schema';

interface SellersViewProps {
  sellers: SellerWithDistance[];
  isLoading: boolean;
  onCreateRequest: () => void;
}

export default function SellersView({ sellers, isLoading, onCreateRequest }: SellersViewProps) {
  const formatLastSeen = (lastSeen: Date | string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 animate-pulse rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-3 w-24 bg-gray-200 animate-pulse rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          {sellers.length} seller{sellers.length !== 1 ? 's' : ''} nearby
        </span>
        <Button
          onClick={onCreateRequest}
          className="bg-primary text-white hover:bg-primary/90"
          size="sm"
        >
          Post Request
        </Button>
      </div>

      <div className="space-y-3">
        {sellers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No sellers found nearby</div>
            <p className="text-sm text-gray-400">
              Try adjusting your location or expanding the search radius
            </p>
          </div>
        ) : (
          sellers.map((seller) => (
            <div
              key={seller.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {seller.profileImageUrl ? (
                    <img
                      src={seller.profileImageUrl}
                      alt={seller.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {seller.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Online status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    seller.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{seller.name}</span>
                    <Badge variant={seller.isOnline ? "default" : "secondary"} className="text-xs">
                      {seller.isOnline ? (
                        <>
                          <WifiIcon className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <WifiOffIcon className="w-3 h-3 mr-1" />
                          Away
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-yellow-400">
                      <StarIcon className="w-3 h-3 fill-current mr-1" />
                      <span className="text-sm text-gray-600">{seller.rating}</span>
                    </div>
                    {seller.distance && (
                      <span className="text-sm text-gray-500">
                        {seller.distance.toFixed(1)} km away
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500">Last seen</div>
                  <div className="text-sm font-medium text-gray-900">
                    {seller.lastSeen ? formatLastSeen(seller.lastSeen) : 'Unknown'}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
