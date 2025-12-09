import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { GenerationProgress } from '@/components/GenerationProgress';
import { ThumbnailGuide } from '@/components/ThumbnailGuide';
import { ConversationMessage, AIModel, FormatSettings, UploadedImage } from '@/types/thumbnail';
import { Sparkles } from 'lucide-react';

interface ChatAreaProps {
  messages: ConversationMessage[];
  isGenerating: boolean;
  hasConversation: boolean;
  onSend: (prompt: string, images: UploadedImage[], model: AIModel, format: FormatSettings) => void;
  remainingForModel: (model: AIModel) => number;
  disabled?: boolean;
}

export function ChatArea({ 
  messages, 
  isGenerating, 
  hasConversation,
  onSend, 
  remainingForModel,
  disabled 
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  return (
    <div className="flex-1 flex flex-col h-full">
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {hasConversation ? 'Créez votre miniature' : 'Bienvenue sur MiniaMaker'}
                </h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {hasConversation 
                    ? 'Décrivez la miniature YouTube que vous souhaitez créer. Ajoutez des images de référence si vous le souhaitez.'
                    : 'Créez une nouvelle conversation pour commencer à générer des miniatures YouTube époustouflantes.'}
                </p>
              </div>
              
              <div className="max-w-2xl mx-auto">
                <ThumbnailGuide />
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}

          {isGenerating && (
            <div className="py-4">
              <GenerationProgress isGenerating={isGenerating} />
            </div>
          )}
        </div>
      </ScrollArea>

      {hasConversation && (
        <ChatInput 
          onSend={onSend}
          isGenerating={isGenerating}
          disabled={disabled}
          remainingForModel={remainingForModel}
        />
      )}
    </div>
  );
}
