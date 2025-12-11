import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ImageUploader';
import { ModelSelector } from '@/components/ModelSelector';
import { FormatSettingsPopover } from '@/components/FormatSettingsPopover';
import { AdvancedPromptDialog } from '@/components/AdvancedPromptDialog';
import { Send, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { AIModel, FormatSettings, UploadedImage, DEFAULT_FORMAT_SETTINGS } from '@/types/thumbnail';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ChatInputProps {
  onSend: (prompt: string, images: UploadedImage[], model: AIModel, format: FormatSettings) => void;
  isGenerating: boolean;
  disabled?: boolean;
  remainingForModel: (model: AIModel) => number;
}

export function ChatInput({ onSend, isGenerating, disabled, remainingForModel }: ChatInputProps) {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel>('google/gemini-2.5-flash-image-preview');
  const [formatSettings, setFormatSettings] = useState<FormatSettings>(DEFAULT_FORMAT_SETTINGS);
  const [showImages, setShowImages] = useState(false);
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = remainingForModel(selectedModel);
  const canGenerate = remaining !== 0 && !disabled;

  const handleSend = () => {
    if (!prompt.trim() || isGenerating || !canGenerate) return;
    onSend(prompt, images, selectedModel, formatSettings);
    setPrompt('');
    setImages([]);
    setShowImages(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAdvancedPrompt = (generatedPrompt: string) => {
    setPrompt(generatedPrompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-border/50 bg-background p-4 space-y-3">
      {/* Advanced Prompt Dialog */}
      <AdvancedPromptDialog
        open={showAdvancedPrompt}
        onOpenChange={setShowAdvancedPrompt}
        onGenerate={handleAdvancedPrompt}
      />

      {/* Images section */}
      <Collapsible open={showImages} onOpenChange={setShowImages}>
        <CollapsibleContent>
          <div className="mb-3">
            <ImageUploader images={images} onImagesChange={setImages} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Prompt mode selector */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedPrompt(true)}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Prompt Avancé
        </Button>
      </div>

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Décrivez la miniature que vous voulez créer..."
            className="min-h-[60px] max-h-[200px] pr-12 resize-none"
            disabled={isGenerating || disabled}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2"
            onClick={() => setShowImages(!showImages)}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector 
            selectedModel={selectedModel} 
            onModelChange={setSelectedModel} 
          />
          <FormatSettingsPopover 
            settings={formatSettings} 
            onSettingsChange={setFormatSettings} 
          />
          <Button
            onClick={handleSend}
            disabled={!prompt.trim() || isGenerating || !canGenerate}
            size="lg"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Remaining generations warning */}
      {remaining === 0 && (
        <p className="text-xs text-destructive text-center">
          Vous avez atteint la limite quotidienne pour ce modèle. Passez à un forfait supérieur pour continuer.
        </p>
      )}
      {remaining > 0 && remaining <= 2 && (
        <p className="text-xs text-amber-500 text-center">
          Plus que {remaining} génération{remaining > 1 ? 's' : ''} pour ce modèle aujourd'hui.
        </p>
      )}
    </div>
  );
}
