import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { ModeSelector } from "@/components/ModeSelector";
import { GuidedTemplateEditor } from "@/components/GuidedTemplateEditor";
import { FreePromptEditor } from "@/components/FreePromptEditor";
import { AssistedWizard } from "@/components/AssistedWizard";
import { ThumbnailResults } from "@/components/ThumbnailResults";
import { ThumbnailGuide } from "@/components/ThumbnailGuide";
import { ModelSelector } from "@/components/ModelSelector";
import { FormatSettings } from "@/components/FormatSettings";
import { GenerationProgress } from "@/components/GenerationProgress";
import { 
  InputMode, 
  TemplateData, 
  UploadedImage, 
  GeneratedThumbnail,
  AIModel,
  FormatSettings as FormatSettingsType,
  DEFAULT_FORMAT_SETTINGS 
} from "@/types/thumbnail";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

const defaultTemplate: TemplateData = {
  name: 'Template Sans Titre',
  videoContext: '',
  objective: '',
  mainSubject: '',
  emotion: '',
  shortText: '',
  visualStyle: '',
};

export default function Index() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mode, setMode] = useState<InputMode>('guided');
  const [template, setTemplate] = useState<TemplateData>(defaultTemplate);
  const [freePrompt, setFreePrompt] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [thumbnails, setThumbnails] = useState<GeneratedThumbnail[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('google/gemini-2.5-flash-image-preview');
  const [formatSettings, setFormatSettings] = useState<FormatSettingsType>(DEFAULT_FORMAT_SETTINGS);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnexion réussie");
  };

  const buildPromptFromTemplate = (template: TemplateData): string => {
    const parts = [];
    
    if (template.mainSubject) {
      parts.push(`Sujet principal: ${template.mainSubject}`);
    }
    if (template.emotion) {
      parts.push(`Émotion/Ton: ${template.emotion}`);
    }
    if (template.shortText) {
      parts.push(`Texte à afficher: "${template.shortText}"`);
    }
    if (template.visualStyle) {
      parts.push(`Style visuel: ${template.visualStyle}`);
    }
    if (template.videoContext) {
      parts.push(`Contexte: ${template.videoContext}`);
    }
    if (template.objective) {
      parts.push(`Objectif: ${template.objective}`);
    }

    return parts.join('. ');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const prompt = mode === 'free' ? freePrompt : buildPromptFromTemplate(template);
      
      if (!prompt.trim()) {
        toast.error("Veuillez remplir au moins un champ");
        setIsGenerating(false);
        return;
      }

      // Collect image URLs
      const imageUrls = images.map(img => img.url).filter(url => url && !url.startsWith('blob:'));

      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: { 
          prompt,
          model: selectedModel,
          images: imageUrls,
          format: formatSettings
        }
      });

      if (error) {
        console.error('Erreur génération:', error);
        if (error.message?.includes('429')) {
          toast.error("Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.");
        } else if (error.message?.includes('402')) {
          toast.error("Crédits épuisés. Veuillez recharger votre compte.");
        } else {
          toast.error("Erreur lors de la génération. Veuillez réessayer.");
        }
        return;
      }

      if (data?.thumbnails && data.thumbnails.length > 0) {
        setThumbnails(data.thumbnails.map((url: string) => ({
          id: crypto.randomUUID(),
          url,
          prompt,
          createdAt: new Date(),
          isFavorite: false,
        })));
        toast.success(`${data.thumbnails.length} miniatures générées avec ${data.model ? 'succès' : 'succès'} !`);
      } else {
        toast.error("Aucune miniature générée. Veuillez réessayer.");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
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
        {/* Auth Status */}
        <div className="flex justify-end mb-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Connexion
              </Button>
            </Link>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center mb-10 opacity-0 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 font-display">
            Créez des <span className="text-gradient">Miniatures YouTube</span> Époustouflantes
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Générez des miniatures YouTube performantes grâce à l'IA. 
            Choisissez votre mode de création et laissez la magie opérer.
          </p>
        </div>

        {/* Guide */}
        <div className="mb-8">
          <ThumbnailGuide />
        </div>

        {/* Model Selector */}
        <div className="mb-8">
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
        </div>

        {/* Format Settings */}
        <div className="mb-8">
          <FormatSettings settings={formatSettings} onSettingsChange={setFormatSettings} />
        </div>

        {/* Mode Selection */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            Choisissez votre mode
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

        {/* Progress Bar */}
        {isGenerating && (
          <div className="mb-8">
            <GenerationProgress isGenerating={isGenerating} />
          </div>
        )}

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
          <p>Fait avec ❤️ pour les créateurs de contenu</p>
        </div>
      </footer>
    </div>
  );
}
