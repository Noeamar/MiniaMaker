import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useState } from 'react';

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onDownload: () => void;
  isDownloading?: boolean;
}

export function ImagePreviewModal({ 
  open, 
  onOpenChange, 
  imageUrl, 
  onDownload,
  isDownloading 
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden">
        <div className="relative h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={onDownload} disabled={isDownloading}>
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Traitement...' : 'Télécharger'}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Image container */}
          <div className="flex-1 overflow-auto bg-black/90 flex items-center justify-center p-4">
            <img
              src={imageUrl}
              alt="Prévisualisation"
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
