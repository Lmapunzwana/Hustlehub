import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExpandableModalProps {
  title: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export default function ExpandableModal({
  title,
  children,
  isExpanded,
  onExpandedChange,
}: ExpandableModalProps) {
  const isMobile = useIsMobile();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);

  // Handle touch/mouse events for expanding
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobile) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    // Expand if swiping up significantly while collapsed
    if (deltaY < -50 && !isExpanded) {
      onExpandedChange(true);
      setIsDragging(false);
    }
    // Collapse if swiping down significantly while expanded
    else if (deltaY > 50 && isExpanded) {
      onExpandedChange(false);
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Auto-expand on desktop when content is focused
  useEffect(() => {
    if (!isMobile) {
      onExpandedChange(true);
    }
  }, [isMobile, onExpandedChange]);

  // Handle click to expand on mobile (when not expanded)
  const handleClick = (e: React.MouseEvent) => {
    if (isMobile && !isExpanded) {
      // Only expand if not clicking on interactive elements
      const target = e.target as HTMLElement;
      if (!target.closest('button, input, textarea, select, a')) {
        onExpandedChange(true);
      }
    }
  };

  return (
    <div
      ref={modalRef}
      className={cn(
        "bottom-sheet fixed bg-white shadow-2xl z-50",
        "md:right-0 md:top-0 md:h-full md:w-96 md:border-l md:border-gray-200",
        // Mobile positioning
        isMobile && "bottom-0 left-0 right-0 min-h-[55vh]",
        // Mobile rounded corners
        isMobile && "rounded-t-[20px]",
        // Desktop positioning and rounded corners
        !isMobile && "rounded-l-2xl",
        // Expansion state
        isExpanded ? "expanded" : ""
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      {/* Modal Handle - Mobile Only */}
      {isMobile && (
        <div className="modal-handle" />
      )}

      {/* Modal Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onExpandedChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto h-full pb-20 md:pb-4 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}
