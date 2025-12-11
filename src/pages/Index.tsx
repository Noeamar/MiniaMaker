import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ModeSelector } from "@/components/ModeSelector";
import { GuidedTemplateEditor } from "@/components/GuidedTemplateEditor";
import { FreePromptEditor } from "@/components/FreePromptEditor";
import { AssistedWizard } from "@/components/AssistedWizard";
import { ThumbnailResults } from "@/components/ThumbnailResults";
import { ThumbnailGuide } from "@/components/ThumbnailGuide";
import { ModelSelector } from "@/components/ModelSelector";
import { FormatSettingsPopover } from "@/components/FormatSettingsPopover";
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
import { Sparkles } from "lucide-react";
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

      // Collect all image URLs - both uploaded and blob URLs need to be converted
      const imageUrls: string[] = [];
      
      for (const img of images) {
        if (img.url && !img.url.startsWith('blob:')) {
          imageUrls.push(img.url);
        } else if (img.file) {
          // Convert blob to base64
          const base64 = await fileToBase64(img.file);
          if (base64) {
            imageUrls.push(base64);
          }
        }
      }

      // Call generation API using fetch directly to have better error handling
      console.log('=== CALLING GENERATE-THUMBNAIL ===');
      console.log('Request data:', { prompt, model, imagesCount: imageUrls.length, format });
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      console.log('Supabase config:', {
        url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
        key: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING'
      });
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase configuration!');
        toast.error("Configuration manquante. Vérifiez vos variables d'environnement.");
        return;
      }
      
      const functionUrl = `${supabaseUrl}/functions/v1/generate-thumbnail`;
      console.log('Function URL:', functionUrl);
      
      let data: any = null;
      let error: any = null;
      
      try {
        console.log('Sending fetch request...');
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({
            prompt,
            model,
            images: imageUrls,
            format,
            conversationHistory: user && currentConversation ? messages
              .filter(msg => msg.role === 'user' || msg.role === 'assistant')
              .slice(-10) // Keep last 10 messages for context
              .map(msg => ({
                role: msg.role,
                content: msg.content
              })) : []
          })
        });

        console.log('Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (!response.ok) {
          // Extract error message from response body
          const errorMsg = responseData.error || responseData.message || `HTTP ${response.status}`;
          const errorDetails = responseData.details || responseData.parsedError || null;
          
          console.error('Error response from function:', {
            status: response.status,
            error: errorMsg,
            details: errorDetails,
            fullResponse: responseData
          });
          
          error = {
            message: errorMsg,
            status: response.status,
            context: { body: responseData, details: errorDetails }
          };
        } else {
          data = responseData;
        }
      } catch (fetchError: any) {
        console.error('Fetch error:', fetchError);
        error = {
          message: fetchError.message || 'Erreur de connexion',
          context: { originalError: fetchError }
        };
      }

      console.log('Response received:', { 
        hasData: !!data, 
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : [],
        errorMessage: error?.message,
        errorStatus: error?.status
      });

      // Check if data contains an error (even if error is null)
      if (data?.error) {
        console.error('Error in response data:', data.error);
        const errorMsg = data.error || 'Erreur inconnue';
        
        let toastMessage = "Erreur lors de la génération.";
        if (errorMsg.includes('402') || errorMsg.includes('Quota') || errorMsg.includes('Crédits épuisés') || errorMsg.includes('recharger')) {
          toastMessage = errorMsg.length > 150 ? errorMsg.substring(0, 150) + '...' : errorMsg;
        } else if (errorMsg.includes('429')) {
          toastMessage = "Limite de requêtes atteinte. Veuillez réessayer.";
        } else if (errorMsg.includes('403')) {
          toastMessage = "Clé API invalide ou permissions insuffisantes.";
        } else {
          toastMessage = errorMsg.length > 150 ? errorMsg.substring(0, 150) + '...' : errorMsg;
        }
        
        toast.error(toastMessage);
        
        const errorMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          conversation_id: currentConversation?.id || 'trial',
          role: 'assistant',
          content: `Erreur: ${errorMsg}`,
          image_urls: [],
          model_used: null,
          settings: {},
          created_at: new Date().toISOString()
        };
        
        try {
          if (user && currentConversation) {
            await addMessage('assistant', errorMessage.content);
          } else {
            setTrialMessages(prev => [...prev, errorMessage]);
          }
        } catch (msgError) {
          console.error('Error adding error message:', msgError);
        }
        return;
      }

      if (error) {
        console.error('Erreur génération:', error);
        console.error('Error details:', {
          message: error.message,
          context: error.context,
          name: error.name,
          data: (error as any).data,
          response: (error as any).response
        });
        
        // Extract error message from various possible locations
        let errorMessage = error.message || 'Erreur inconnue';
        
        // Try to extract from error.data (Supabase sometimes puts response body here)
        if ((error as any).data) {
          try {
            const errorData = typeof (error as any).data === 'string' 
              ? JSON.parse((error as any).data) 
              : (error as any).data;
            if (errorData?.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            console.warn('Could not parse error.data:', e);
          }
        }
        
        // Try to extract from error.context.body
        if (error.context?.body) {
          try {
            const errorBody = typeof error.context.body === 'string' 
              ? JSON.parse(error.context.body) 
              : error.context.body;
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } catch (e) {
            console.warn('Could not parse error context body:', e);
          }
        }
        
        // Try to extract from error.context.response
        if (error.context?.response) {
          try {
            const responseData = typeof error.context.response === 'string' 
              ? JSON.parse(error.context.response) 
              : error.context.response;
            if (responseData?.error) {
              errorMessage = responseData.error;
            }
          } catch (e) {
            console.warn('Could not parse error context response:', e);
          }
        }
        
        // If error message is the generic one, try to get more details
        if (errorMessage === 'Edge Function returned a non-2xx status code' || errorMessage.includes('non-2xx')) {
          // Try to fetch the error details from the response
          errorMessage = 'Erreur lors de la génération. Vérifiez les logs pour plus de détails.';
        }
        
        let toastMessage = "Erreur lors de la génération.";
        if (errorMessage.includes('402') || errorMessage.includes('Quota') || errorMessage.includes('Crédits épuisés') || errorMessage.includes('recharger')) {
          toastMessage = errorMessage.length > 150 ? errorMessage.substring(0, 150) + '...' : errorMessage;
        } else if (errorMessage.includes('429')) {
          toastMessage = "Limite de requêtes atteinte. Veuillez réessayer.";
        } else if (errorMessage.includes('403')) {
          toastMessage = "Clé API invalide ou permissions insuffisantes.";
        } else if (errorMessage.length > 0) {
          toastMessage = errorMessage.length > 150 ? errorMessage.substring(0, 150) + '...' : errorMessage;
        }
        
        toast.error(toastMessage);
        
        const errorMsg: ConversationMessage = {
          id: crypto.randomUUID(),
          conversation_id: currentConversation?.id || 'trial',
          role: 'assistant',
          content: `Erreur: ${errorMessage}`,
          image_urls: [],
          model_used: null,
          settings: {},
          created_at: new Date().toISOString()
        };
        
        try {
          if (user && currentConversation) {
            await addMessage('assistant', errorMsg.content);
          } else {
            setTrialMessages(prev => [...prev, errorMsg]);
          }
        } catch (msgError) {
          console.error('Error adding error message:', msgError);
        }
        return;
      }

      // Mark trial as used for non-authenticated users
      if (!user) {
        localStorage.setItem(TRIAL_STORAGE_KEY, 'true');
        setTrialUsed(true);
      } else {
        // Increment usage count for authenticated users
        await incrementGenerationCount(model);
      }

      // Process successful response
      try {
        if (data?.thumbnails && data.thumbnails.length > 0) {
          const successMessage: ConversationMessage = {
            id: crypto.randomUUID(),
            conversation_id: currentConversation?.id || 'trial',
            role: 'assistant',
            content: `Voici ${data.thumbnails.length} miniature${data.thumbnails.length > 1 ? 's' : ''} générée${data.thumbnails.length > 1 ? 's' : ''} !`,
            image_urls: data.thumbnails,
            model_used: model,
            settings: { format },
            created_at: new Date().toISOString()
          };

          try {
            if (user && currentConversation) {
              await addMessage(
                'assistant', 
                successMessage.content,
                data.thumbnails,
                model,
                { format }
              );
            } else {
              setTrialMessages(prev => [...prev, successMessage]);
            }
            toast.success(`${data.thumbnails.length} miniatures générées !`);
          } catch (msgError) {
            console.error('Error adding success message:', msgError);
            toast.success(`${data.thumbnails.length} miniatures générées !`);
            // Still show success even if message addition fails
          }
        } else {
          const noResultMessage: ConversationMessage = {
            id: crypto.randomUUID(),
            conversation_id: currentConversation?.id || 'trial',
            role: 'assistant',
            content: "Aucune miniature n'a pu être générée. Veuillez réessayer avec une description différente.",
            image_urls: [],
            model_used: null,
            settings: {},
            created_at: new Date().toISOString()
          };

          try {
            if (user && currentConversation) {
              await addMessage('assistant', noResultMessage.content);
            } else {
              setTrialMessages(prev => [...prev, noResultMessage]);
            }
            toast.error("Aucune miniature générée.");
          } catch (msgError) {
            console.error('Error adding no-result message:', msgError);
            toast.error("Aucune miniature générée.");
          }
        }
      } catch (processError) {
        console.error('Error processing response:', processError);
        toast.error("Erreur lors du traitement de la réponse.");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const getRemainingForModel = (model: AIModel): number => {
    if (!user) {
      // Trial mode: 1 free generation with medium model (2.5) if not used
      if (trialUsed) {
        return 0;
      }
      // Only allow medium model (2.5) for trial
      if (model === 'google/gemini-2.5-flash-image-preview') {
        return 1;
      }
      return 0;
    }
    const { remaining } = getRemainingGenerations(model);
    return remaining;
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
      <Header 
        isAuthenticated={!!user} 
        userEmail={user?.email}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <ConversationSidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onNewConversation={handleNewConversation}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onOpenBilling={() => setBillingOpen(true)}
          remainingNano={getRemainingForModel('google/gemini-2.0-basic-lite')}
          remainingGemini={getRemainingForModel('google/gemini-2.5-flash-image-preview')}
          remainingPro={getRemainingForModel('google/gemini-3-pro-image-preview')}
          isAuthenticated={true}
        />

        {/* Guide */}
        <div className="mb-8">
          <ThumbnailGuide />
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

        {/* Generation Controls - Model, Format, Generate Button */}
        <div className="mb-8 flex flex-wrap items-center gap-3 justify-center">
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          <FormatSettingsPopover settings={formatSettings} onSettingsChange={setFormatSettings} />
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            size="lg"
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Générer les miniatures
          </Button>
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