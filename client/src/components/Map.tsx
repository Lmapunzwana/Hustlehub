import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { cn } from '@/lib/utils';
import type { SellerWithDistance } from '@shared/schema';

// Fix for default markers in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapProps {
  sellers: SellerWithDistance[];
  userLocation?: { lat: number; lng: number } | null;
  className?: string;
  onSellerHover?: (seller: SellerWithDistance | null) => void;
}

export default function Map({ sellers, userLocation, className }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map centered on Harare, Zimbabwe
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView([-17.8252, 31.0335], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create marker cluster group
    const markersGroup = L.markerClusterGroup({
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 10) size = 'large';
        else if (count > 5) size = 'medium';

        return L.divIcon({
          html: `<div class="marker-cluster marker-cluster-${size}">${count}</div>`,
          className: 'custom-cluster-icon',
          iconSize: size === 'small' ? [30, 30] : size === 'medium' ? [40, 40] : [50, 50],
        });
      },
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
    });

    map.addLayer(markersGroup);

    mapInstanceRef.current = map;
    markersRef.current = markersGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }

    // Add new user marker
    const userMarker = L.circleMarker([userLocation.lat, userLocation.lng], {
      radius: 10,
      fillColor: '#2563EB',
      color: '#fff',
      weight: 3,
      opacity: 1,
      fillOpacity: 1,
    }).bindPopup('Your location');

    userMarker.addTo(mapInstanceRef.current);
    userMarkerRef.current = userMarker;

    // Center map on user location
    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 15);
  }, [userLocation]);

  // Update seller markers
  useEffect(() => {
    if (!markersRef.current || !sellers.length) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Add seller markers
    sellers.forEach((seller) => {
      const lat = parseFloat(seller.latitude);
      const lng = parseFloat(seller.longitude);

      const marker = L.circleMarker([lat, lng], {
        radius: seller.isOnline ? 12 : 8,
        fillColor: seller.isOnline ? '#10B981' : '#9CA3AF',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      });

      // Add hover events
      marker.on('mouseover', () => {
        onSellerHover?.(seller);
        marker.setStyle({
          radius: seller.isOnline ? 16 : 12,
          weight: 3
        });
      });

      marker.on('mouseout', () => {
        onSellerHover?.(null);
        marker.setStyle({
          radius: seller.isOnline ? 12 : 8,
          weight: 2
        });
      });

      const lastSeenText = seller.lastSeen ? 
        new Date(seller.lastSeen).toLocaleString() : 'Unknown';

      const distanceText = seller.distance ? 
        `${seller.distance.toFixed(1)} km away` : '';

      marker.bindPopup(`
        <div class="text-center p-2 font-sans">
          <div class="flex items-center space-x-2 mb-2">
            ${seller.profileImageUrl ? 
              `<img src="${seller.profileImageUrl}" alt="${seller.name}" class="w-8 h-8 rounded-full object-cover">` : 
              '<div class="w-8 h-8 rounded-full bg-gray-300"></div>'
            }
            <div class="text-left">
              <div class="font-medium text-sm">${seller.name}</div>
              <div class="text-xs text-gray-600">⭐ ${seller.rating}</div>
            </div>
          </div>
          <div class="text-xs ${seller.isOnline ? 'text-green-600' : 'text-gray-500'} mb-1">
            ${seller.isOnline ? 'Online' : 'Offline'}
          </div>
          ${distanceText ? `<div class="text-xs text-gray-600 mb-1">${distanceText}</div>` : ''}
          <div class="text-xs text-gray-500">Last seen: ${lastSeenText}</div>
        </div>
      `);

      markersRef.current?.addLayer(marker);
    });
  }, [sellers]);

  return (
    <div
      ref={mapRef}
      className={cn("w-full h-full", className)}
      style={{ zIndex: 0 }}
    />
  );
}
