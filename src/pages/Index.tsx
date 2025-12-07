import { useState } from "react";
import { Header } from "@/components/Header";
import { ModeSelector } from "@/components/ModeSelector";
import { GuidedTemplateEditor } from "@/components/GuidedTemplateEditor";
import { FreePromptEditor } from "@/components/FreePromptEditor";
import { AssistedWizard } from "@/components/AssistedWizard";
import { ThumbnailResults } from "@/components/ThumbnailResults";
import { ThumbnailGuide } from "@/components/ThumbnailGuide";
import { InputMode, TemplateData, UploadedImage, GeneratedThumbnail } from "@/types/thumbnail";
import { toast } from "sonner";

const defaultTemplate: TemplateData = {
  name: 'Untitled Template',
  videoContext: '',
  objective: '',
  mainSubject: '',
  emotion: '',
  shortText: '',
  visualStyle: '',
};

// Placeholder thumbnails for demo
const demoThumbnails: GeneratedThumbnail[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=640&h=360&fit=crop',
    prompt: 'Demo thumbnail 1',
    createdAt: new Date(),
    isFavorite: false,
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=640&h=360&fit=crop',
    prompt: 'Demo thumbnail 2',
    createdAt: new Date(),
    isFavorite: false,
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640&h=360&fit=crop',
    prompt: 'Demo thumbnail 3',
    createdAt: new Date(),
    isFavorite: false,
  },
];

export default function Index() {
  const [mode, setMode] = useState<InputMode>('guided');
  const [template, setTemplate] = useState<TemplateData>(defaultTemplate);
  const [freePrompt, setFreePrompt] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For now, show demo thumbnails
    setThumbnails(demoThumbnails.map(t => ({ ...t, id: crypto.randomUUID() })));
    setIsGenerating(false);
    toast.success("Thumbnails generated! (Demo mode)");
  };

  const handleToggleFavorite = (id: string) => {
    setThumbnails(thumbnails.map(t => 
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const handleWizardComplete = (wizardTemplate: TemplateData) => {
    setTemplate(wizardTemplate);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-10 opacity-0 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Create <span className="text-gradient">Stunning</span> Thumbnails
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate high-performing YouTube thumbnails with AI. 
            Choose your creation style and let the magic happen.
          </p>
        </div>

        {/* Guide */}
        <div className="mb-8">
          <ThumbnailGuide />
        </div>

        {/* Mode Selection */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            Choose your mode
          </h2>
          <ModeSelector selectedMode={mode} onModeChange={setMode} />
        </div>

        {/* Editor based on mode */}
        <div className="mb-8">
          {mode === 'guided' && (
            <GuidedTemplateEditor
              template={template}
              onTemplateChange={setTemplate}
              images={images}
              onImagesChange={setImages}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}
          
          {mode === 'free' && (
            <FreePromptEditor
              prompt={freePrompt}
              onPromptChange={setFreePrompt}
              images={images}
              onImagesChange={setImages}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}
          
          {mode === 'assisted' && (
            <AssistedWizard
              onComplete={handleWizardComplete}
              images={images}
              onImagesChange={setImages}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          )}
        </div>

        {/* Results */}
        <ThumbnailResults
          thumbnails={thumbnails}
          onToggleFavorite={handleToggleFavorite}
          onRegenerate={handleGenerate}
          isRegenerating={isGenerating}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built with ❤️ for content creators</p>
        </div>
      </footer>
    </div>
  );
}
