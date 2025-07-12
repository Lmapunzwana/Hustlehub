
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageCarousel from './ImageCarousel';

interface OfferCreationFormProps {
  onSubmit: (offerData: any) => void;
  userLocation: { lat: number; lng: number } | null;
}

export default function OfferCreationForm({ onSubmit, userLocation }: OfferCreationFormProps) {
  const [formData, setFormData] = useState({
    productName: '',
    description: '',
    price: '',
    quantity: 1,
    radius: 5
  });
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "Maximum 5 images allowed",
        variant: "destructive"
      });
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        setImages(prev => [...prev, file]);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userLocation) {
      toast({
        title: "Location required",
        description: "Please enable location services",
        variant: "destructive"
      });
      return;
    }

    if (images.length < 2) {
      toast({
        title: "Minimum 2 images required",
        description: "Please upload at least 2 product images",
        variant: "destructive"
      });
      return;
    }

    if (!formData.productName || !formData.description || !formData.price) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('buyer_id', 'buyer_1'); // Replace with actual buyer ID
      submitData.append('product_name', formData.productName);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('quantity', formData.quantity.toString());
      submitData.append('lat', userLocation.lat.toString());
      submitData.append('lng', userLocation.lng.toString());
      submitData.append('radius', formData.radius.toString());
      
      images.forEach(image => {
        submitData.append('images', image);
      });

      const response = await fetch('http://localhost:8000/api/offers', {
        method: 'POST',
        body: submitData
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Offer created successfully",
          description: "Your offer has been sent to nearby sellers"
        });
        onSubmit(result);
        
        // Reset form
        setFormData({
          productName: '',
          description: '',
          price: '',
          quantity: 1,
          radius: 5
        });
        setImages([]);
        setImagePreviews([]);
      } else {
        throw new Error('Failed to create offer');
      }
    } catch (error) {
      toast({
        title: "Error creating offer",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Product Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <Label htmlFor="productName">Product Name *</Label>
            <Input
              id="productName"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              placeholder="What are you looking for?"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide details about what you need..."
              rows={3}
              required
            />
          </div>

          {/* Price and Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Maximum Price ($) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Quantity is fixed, sellers can only adjust price</p>
            </div>
          </div>

          {/* Search Radius */}
          <div>
            <Label htmlFor="radius">Search Radius (km)</Label>
            <Input
              id="radius"
              name="radius"
              type="number"
              min="1"
              max="50"
              value={formData.radius}
              onChange={handleInputChange}
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Product Images (minimum 2) *</Label>
            <div className="mt-2">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload images (max 5)
                  </span>
                </label>
              </div>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <div className="mb-2">
                  <ImageCarousel images={imagePreviews} className="h-48" />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || images.length < 2}
          >
            {isSubmitting ? "Creating Offer..." : "Send to Nearby Sellers"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
