import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { GenerationProgress } from '@/components/GenerationProgress';
import { ThumbnailGuide } from '@/components/ThumbnailGuide';
import { PromptTemplates } from '@/components/PromptTemplates';
import { ConversationMessage, AIModel, FormatSettings, UploadedImage, DEFAULT_FORMAT_SETTINGS } from '@/types/thumbnail';
import { Sparkles } from 'lucide-react';

interface ChatAreaProps {
  messages: ConversationMessage[];
  isGenerating: boolean;
  hasConversation: boolean;
  onSend: (prompt: string, images: UploadedImage[], model: AIModel, format: FormatSettings) => void;
  remainingForModel: (model: AIModel) => number;
  disabled?: boolean;
  userId?: string;
  onRegenerate?: (prompt: string, model: AIModel, format: FormatSettings) => void;
}

export function ChatArea({ 
  messages, 
  isGenerating, 
  hasConversation,
  onSend, 
  remainingForModel,
  disabled,
  userId,
  onRegenerate
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pendingPrompt, setPendingPrompt] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  const handleTemplateSelect = (prompt: string) => {
    setPendingPrompt(prompt);
  };

  const handleRegenerate = (content: string, settings: Record<string, unknown>) => {
    // Find the last user message to get the original prompt
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage && onRegenerate) {
      const model = (settings?.model as AIModel) || 'google/gemini-2.5-flash-image';
      const format = (settings?.format as FormatSettings) || DEFAULT_FORMAT_SETTINGS;
      onRegenerate(lastUserMessage.content, model, format);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto p-2 md:p-4 space-y-3 md:space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 md:py-12 space-y-4 md:space-y-6">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Créez votre miniature
                </h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto px-4">
                  Décrivez la miniature YouTube que vous souhaitez créer. Ajoutez des images de référence si vous le souhaitez.
                </p>
              </div>

              {/* Prompt Templates */}
              <div className="max-w-2xl mx-auto px-2">
                <PromptTemplates onSelect={handleTemplateSelect} />
              </div>
              
              <div className="max-w-2xl mx-auto px-2">
                <ThumbnailGuide />
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                userId={userId}
                onRegenerate={handleRegenerate}
              />
            ))
          )}

          {isGenerating && (
            <div className="py-2 md:py-4">
              <GenerationProgress isGenerating={isGenerating} />
            </div>
          )}
        </div>
      </ScrollArea>

      <ChatInput 
        onSend={onSend}
        isGenerating={isGenerating}
        disabled={disabled}
        remainingForModel={remainingForModel}
        initialPrompt={pendingPrompt}
        onPromptUsed={() => setPendingPrompt('')}
      />
    </div>
  );
}

