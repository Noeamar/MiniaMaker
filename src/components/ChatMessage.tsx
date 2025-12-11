import { useState } from 'react';
import { ConversationMessage } from '@/types/thumbnail';
import { cn } from '@/lib/utils';
import { User, Bot, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackDialog } from '@/components/FeedbackDialog';

interface ChatMessageProps {
  message: ConversationMessage;
  userId?: string;
}

export function ChatMessage({ message, userId }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `miniature-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      
      // Show feedback dialog after download
      setSelectedImageUrl(url);
      setFeedbackOpen(true);
    } catch (error) {
      console.error('Download error:', error);
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
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Télécharger
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

