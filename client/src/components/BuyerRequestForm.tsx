import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BuyerRequestFormProps {
  onRequestCreated?: (requestId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  categories: Array<{ id: number; name: string; slug: string }>;
}

export default function BuyerRequestForm({ onRequestCreated, userLocation, categories }: BuyerRequestFormProps) {
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    price: '',
    quantity: 1,
    images: [] as File[]
  });
  const [autoAccept, setAutoAccept] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createOfferMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('http://localhost:8000/api/offers', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) {
        throw new Error('Failed to create offer');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Offer Created!",
        description: "Your offer has been broadcast to nearby sellers.",
      });
      onRequestCreated?.(data.offer_id);
      // Reset form
      setFormData({
        product_name: '',
        description: '',
        price: '',
        quantity: 1,
        images: []
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please enable location services to create an offer.",
        variant: "destructive",
      });
      return;
    }

    if (formData.images.length < 2) {
      toast({
        title: "Images Required",
        description: "Please upload at least 2 images of what you're looking for.",
        variant: "destructive",
      });
      return;
    }

    const submitData = new FormData();
    submitData.append('buyer_id', `buyer_${Math.random().toString(36).substr(2, 9)}`);
    submitData.append('product_name', formData.product_name);
    submitData.append('description', formData.description);
    submitData.append('price', formData.price);
    submitData.append('quantity', formData.quantity.toString());
    submitData.append('lat', userLocation.lat.toString());
    submitData.append('lng', userLocation.lng.toString());
    submitData.append('radius', '5.0');

    formData.images.forEach(image => {
      submitData.append('images', image);
    });

    createOfferMutation.mutate(submitData);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 5) // Max 5 images
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>What are you looking for?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="product_name">Product Name</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
              placeholder="e.g., Fresh vegetables"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what you're looking for..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Budget ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="25.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>Images (minimum 2 required)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label htmlFor="images" className="cursor-pointer">
                <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload images ({formData.images.length}/5)
                </p>
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {formData.images.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={createOfferMutation.isPending}
          >
            {createOfferMutation.isPending ? 'Creating Offer...' : 'Post Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}