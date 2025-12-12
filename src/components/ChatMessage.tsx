import { useState } from 'react';
import { ConversationMessage, FormatSettings, ThumbnailRatio, ThumbnailResolution } from '@/types/thumbnail';
import { cn } from '@/lib/utils';
import { User, Bot, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackDialog } from '@/components/FeedbackDialog';
import { toast } from 'sonner';

interface ChatMessageProps {
  message: ConversationMessage;
  userId?: string;
}

// Calculate dimensions based on resolution and ratio
function getDimensions(resolution: ThumbnailResolution, ratio: ThumbnailRatio, customRatio?: string): { width: number; height: number } {
  const ratioValue = ratio === 'custom' && customRatio ? customRatio : ratio;
  
  const resMap: Record<ThumbnailResolution, Record<string, { width: number; height: number }>> = {
    '720p': {
      '16:9': { width: 1280, height: 720 },
      '1:1': { width: 720, height: 720 },
      '9:16': { width: 720, height: 1280 },
    },
    '1080p': {
      '16:9': { width: 1920, height: 1080 },
      '1:1': { width: 1080, height: 1080 },
      '9:16': { width: 1080, height: 1920 },
    },
    '4K': {
      '16:9': { width: 3840, height: 2160 },
      '1:1': { width: 2160, height: 2160 },
      '9:16': { width: 2160, height: 3840 },
    },
  };
  
  // Handle custom ratio (e.g., "21:9" -> 21/9)
  if (ratio === 'custom' && customRatio) {
    const [w, h] = customRatio.split(':').map(Number);
    if (w && h) {
      const aspectRatio = w / h;
      const baseHeight = resolution === '720p' ? 720 : resolution === '1080p' ? 1080 : 2160;
      return { width: Math.round(baseHeight * aspectRatio), height: baseHeight };
    }
  }
  
  return resMap[resolution]?.[ratioValue] || resMap['1080p']['16:9'];
}

// Resize image to exact dimensions specified by user (frontend processing)
function resizeImage(base64: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw image resized to exact dimensions
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 JPEG with high quality
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}

// Resize image to match format specifications
async function resizeImageToFormat(
  imageUrl: string,
  format: FormatSettings
): Promise<Blob> {
  // Get target dimensions from format settings
  const { width: targetWidth, height: targetHeight } = getDimensions(
    format.resolution,
    format.ratio,
    format.customRatio
  );

  // Convert image URL to base64 if needed
  let base64Image: string;
  
  if (imageUrl.startsWith('data:')) {
    // Already base64
    base64Image = imageUrl;
  } else {
    // Fetch and convert to base64
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      base64Image = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to load image');
    }
  }

  // Resize using the simple resize function
  const resizedBase64 = await resizeImage(base64Image, targetWidth, targetHeight);

  // Convert base64 to Blob
  const response = await fetch(resizedBase64);
  const blob = await response.blob();
  
  return blob;
}

export function ChatMessage({ message, userId }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState<Record<number, boolean>>({});

  const handleDownload = async (url: string, index: number) => {
    try {
      setIsProcessing(prev => ({ ...prev, [index]: true }));
      
      // Get format settings from message
      const format = message.settings?.format as FormatSettings | undefined;
      
      let blob: Blob;
      if (format && format.resolution && format.ratio) {
        // Resize image to match format specifications
        blob = await resizeImageToFormat(url, format);
      } else {
        // Fallback: download original image
        const response = await fetch(url);
        blob = await response.blob();
      }
      
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Generate filename with format info if available
      const formatInfo = format 
        ? `_${format.resolution}_${format.ratio === 'custom' ? format.customRatio : format.ratio}`
        : '';
      a.download = `miniature-${index + 1}${formatInfo}.png`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success("Miniature téléchargée avec les spécifications de format !");
      
      // Show feedback dialog after download
      setSelectedImageUrl(url);
      setFeedbackOpen(true);
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setIsProcessing(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <>
      <div className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser ? "bg-secondary/30" : "bg-background"
      )}>
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {/* Display generated images */}
          {message.image_urls && message.image_urls.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {message.image_urls.map((url, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden border border-border">
                  <img 
                    src={url} 
                    alt={`Miniature ${index + 1}`}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(url, index)}
                      disabled={isProcessing[index]}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {isProcessing[index] ? 'Traitement...' : 'Télécharger'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Display model used */}
          {message.model_used && !isUser && (
            <p className="text-xs text-muted-foreground">
              Généré avec {message.model_used}
            </p>
          )}
        </div>
      </div>

      <FeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        thumbnailUrl={selectedImageUrl}
        userId={userId}
      />
    </>
  );
}

