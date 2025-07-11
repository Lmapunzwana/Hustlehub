import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ArrowLeftIcon, CameraIcon, LoaderIcon } from 'lucide-react';
import { insertRequestSchema } from '@shared/schema';
import type { Category, RequestWithOffers } from '@shared/schema';
import { z } from 'zod';

const formSchema = insertRequestSchema.extend({
  categoryId: z.coerce.number().min(1, 'Please select a category'),
});

type FormData = z.infer<typeof formSchema>;

interface BuyerRequestFormProps {
  categories: Category[];
  userLocation?: { lat: number; lng: number } | null;
  onBack: () => void;
  onRequestSubmitted: (request: RequestWithOffers) => void;
}

export default function BuyerRequestForm({
  categories,
  userLocation,
  onBack,
  onRequestSubmitted,
}: BuyerRequestFormProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      maxPrice: 0,
      latitude: userLocation?.lat || 0,
      longitude: userLocation?.lng || 0,
      autoAcceptEnabled: false,
      autoAcceptPrice: 0,
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: FormData & { image?: File }) => {
      const formData = new FormData();
      formData.append('description', data.description);
      formData.append('categoryId', data.categoryId.toString());
      formData.append('maxPrice', data.maxPrice.toString());
      formData.append('latitude', data.latitude.toString());
      formData.append('longitude', data.longitude.toString());
      formData.append('buyerId', '1'); // Demo user ID
      
      if (data.autoAcceptEnabled) {
        formData.append('autoAcceptEnabled', 'true');
        formData.append('autoAcceptPrice', data.autoAcceptPrice?.toString() || '0');
      }
      
      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await fetch('/api/requests', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create request');
      }

      return response.json();
    },
    onSuccess: async (request) => {
      // Create demo offers for testing
      await apiRequest('POST', `/api/demo/create-offers/${request.id}`);
      
      // Fetch the request with offers
      const requestWithOffers = await apiRequest('GET', `/api/requests/${request.id}`);
      
      toast({
        title: 'Request Posted!',
        description: 'Your request is now active. Waiting for offers...',
      });
      
      onRequestSubmitted(requestWithOffers);
    },
    onError: (error) => {
      console.error('Error creating request:', error);
      toast({
        title: 'Error',
        description: 'Failed to create request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: FormData) => {
    if (!userLocation) {
      toast({
        title: 'Location Required',
        description: 'Please enable location access to post a request.',
        variant: 'destructive',
      });
      return;
    }

    createRequestMutation.mutate({
      ...data,
      latitude: userLocation.lat,
      longitude: userLocation.lng,
      image: selectedImage || undefined,
    });
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <FormItem>
            <FormLabel>Product Image</FormLabel>
            <FormControl>
              <div className="space-y-4">
                <label
                  htmlFor="image-upload"
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors block"
                >
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover mx-auto rounded-lg"
                      />
                      <p className="text-sm text-gray-600">Tap to change image</p>
                    </div>
                  ) : (
                    <>
                      <CameraIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Tap to upload image</p>
                    </>
                  )}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </FormControl>
          </FormItem>

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="What are you looking for?"
                    rows={3}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Max Price */}
          <FormField
            control={form.control}
            name="maxPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Price (USD)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <Input
                      {...field}
                      type="number"
                      placeholder="0.00"
                      className="pl-8"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Auto Accept */}
          <Card className="p-4 bg-gray-50 border-gray-200">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoAcceptEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">Auto-Accept Offers</FormLabel>
                      <p className="text-sm text-gray-600">
                        Automatically accept offers at or below your set price
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('autoAcceptEnabled') && (
                <FormField
                  control={form.control}
                  name="autoAcceptPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auto-Accept Price (USD)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500">$</span>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0.00"
                            className="pl-8"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        Offers at or below this price will be automatically accepted
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </Card>

          <Button
            type="submit"
            className="w-full bg-primary text-white hover:bg-primary/90"
            disabled={createRequestMutation.isPending}
          >
            {createRequestMutation.isPending ? (
              <>
                <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                Posting Request...
              </>
            ) : (
              'Post Request'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
