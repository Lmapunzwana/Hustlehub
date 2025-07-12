
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: string[];
  className?: string;
}

export default function ImageCarousel({ images, className }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images.length) return null;

  return (
    <div className={cn("relative w-full h-64 rounded-lg overflow-hidden", className)}>
      {/* Main Image */}
      <div className="relative h-full">
        <img
          src={images[currentIndex]}
          alt={`Product image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-0 shadow-md"
              onClick={goToPrevious}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-0 shadow-md"
              onClick={goToNext}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Image Counter */}
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
      
      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex 
                  ? "bg-white" 
                  : "bg-white/50 hover:bg-white/75"
              )}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
      
      {/* Thumbnail Strip (for larger carousels) */}
      {images.length > 3 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
          <div className="flex space-x-1 justify-center">
            {images.slice(0, 5).map((image, index) => (
              <button
                key={index}
                className={cn(
                  "w-8 h-8 rounded border-2 overflow-hidden",
                  index === currentIndex 
                    ? "border-white" 
                    : "border-white/50 hover:border-white/75"
                )}
                onClick={() => goToSlide(index)}
              >
                <img 
                  src={image} 
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
            {images.length > 5 && (
              <div className="w-8 h-8 rounded border-2 border-white/50 bg-black/50 flex items-center justify-center text-white text-xs">
                +{images.length - 5}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
