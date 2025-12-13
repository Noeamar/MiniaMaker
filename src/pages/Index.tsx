import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { ChatArea } from '@/components/ChatArea';
import { BillingDialog } from '@/components/BillingDialog';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AIModel, FormatSettings, UploadedImage, SubscriptionPlan, ConversationMessage, DEFAULT_FORMAT_SETTINGS } from '@/types/thumbnail';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Play, Sparkles } from 'lucide-react';

const TRIAL_STORAGE_KEY = 'miniamaker_trial_used';

export default function Index() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { 
    conversations, 
    currentConversation, 
    messages, 
    createConversation, 
    selectConversation, 
    deleteConversation,
    addMessage,
    setCurrentConversation,
    setMessages
  } = useConversations(user?.id);
  const { 
    profile, 
    plans, 
    getRemainingGenerations, 
    checkGenerationLimit, 
    incrementGenerationCount,
    refetchProfile
  } = useUserProfile(user?.id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Trial mode state (for non-authenticated users)
  const [trialMessages, setTrialMessages] = useState<ConversationMessage[]>([]);
  const [trialUsed, setTrialUsed] = useState(() => {
    return localStorage.getItem(TRIAL_STORAGE_KEY) === 'true';
  });
  const [isTrialMode, setIsTrialMode] = useState(false);

  const handleLogout = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
  };

  const fileToBase64 = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleSendMessage = async (
    prompt: string, 
    images: UploadedImage[], 
    model: AIModel, 
    format: FormatSettings
  ) => {
    // If not logged in, check trial
    if (!user) {
      if (trialUsed) {
        toast.error("Essai gratuit utilisé. Connectez-vous pour continuer.");
        navigate('/auth');
        return;
      }
    } else {
      // Check generation limit for logged in users
      const limitCheck = await checkGenerationLimit(model);
      if (!limitCheck.allowed) {
        toast.error(limitCheck.error || "Limite quotidienne atteinte");
        setBillingOpen(true);
        return;
      }
    }

    setIsGenerating(true);

    try {
      // Create user message for display
      const userMessage: ConversationMessage = {
        id: crypto.randomUUID(),
        conversation_id: currentConversation?.id || 'trial',
        role: 'user',
        content: prompt,
        image_urls: [],
        model_used: null,
        settings: { model, format },
        created_at: new Date().toISOString()
      };

      if (user && currentConversation) {
        await addMessage('user', prompt, [], null, { model, format });
      } else {
        setTrialMessages(prev => [...prev, userMessage]);
      }

      // Collect all image URLs
      const imageUrls: string[] = [];
      for (const img of images) {
        if (img.url && !img.url.startsWith('blob:')) {
          imageUrls.push(img.url);
        } else if (img.file) {
          const base64 = await fileToBase64(img.file);
          if (base64) imageUrls.push(base64);
        }
      }

      // Call generation API with conversation history for context
      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: { 
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
        }
      });

      if (error) {
        console.error('Erreur génération:', error);
        if (error.message?.includes('429')) {
          toast.error("Limite de requêtes atteinte. Veuillez réessayer.");
        } else if (error.message?.includes('402')) {
          toast.error("Crédits épuisés.");
        } else {
          toast.error("Erreur lors de la génération.");
        }
        
        const errorMessage: ConversationMessage = {
          id: crypto.randomUUID(),
          conversation_id: currentConversation?.id || 'trial',
          role: 'assistant',
          content: "Désolé, une erreur est survenue lors de la génération.",
          image_urls: [],
          model_used: null,
          settings: {},
          created_at: new Date().toISOString()
        };
        
        if (user && currentConversation) {
          await addMessage('assistant', errorMessage.content);
        } else {
          setTrialMessages(prev => [...prev, errorMessage]);
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

        if (user && currentConversation) {
          await addMessage('assistant', noResultMessage.content);
        } else {
          setTrialMessages(prev => [...prev, noResultMessage]);
        }
        toast.error("Aucune miniature générée.");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur de connexion.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getRemainingForModel = (model: AIModel): number => {
    if (!user) {
      // Trial mode: 1 free generation if not used
      return trialUsed ? 0 : 1;
    }
    const { remaining } = getRemainingGenerations(model);
    return remaining;
  };

  const handleNewConversation = async () => {
    if (user) {
      await createConversation();
    } else {
      // Start trial mode
      setIsTrialMode(true);
      setTrialMessages([]);
    }
  };

  const handleStartTrial = () => {
    setIsTrialMode(true);
    setTrialMessages([]);
  };

  // Check for subscription success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success') {
      toast.success("Abonnement activé avec succès !");
      // Force refresh profile after a short delay to allow webhook to process
      setTimeout(() => {
        refetchProfile();
      }, 2000);
      window.history.replaceState({}, '', '/');
    }
  }, [refetchProfile]);

  // Not authenticated but in trial mode
  if (!user && isTrialMode) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header 
          isAuthenticated={false}
          onLogout={handleLogout}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <ChatArea
            messages={trialMessages}
            isGenerating={isGenerating}
            hasConversation={true}
            onSend={handleSendMessage}
            remainingForModel={getRemainingForModel}
            disabled={trialUsed}
            userId={undefined}
          />
        </div>

        {trialUsed && (
          <div className="p-4 border-t border-border bg-secondary/30 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Vous avez utilisé votre essai gratuit. Connectez-vous pour continuer.
            </p>
            <Link to="/auth">
              <Button>Se connecter</Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Not authenticated landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header 
          isAuthenticated={false}
          onLogout={handleLogout}
        />
        
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center space-y-8">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary flex items-center justify-center">
              <Play className="w-10 h-10 text-primary-foreground fill-current" />
            </div>
            
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Créez des <span className="text-gradient">Miniatures YouTube</span> Époustouflantes
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Générez des miniatures YouTube performantes grâce à l'IA. 
                Essayez gratuitement une génération maintenant.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button size="lg" className="gap-2" onClick={handleStartTrial}>
                <Sparkles className="w-5 h-5" />
                Essai gratuit
              </Button>
              <Link to="/auth">
                <Button size="lg" variant="outline">
                  Se connecter
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="p-6 rounded-xl bg-secondary/30 border border-border/50">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold mb-2">3 modèles IA</h3>
                <p className="text-sm text-muted-foreground">
                  Du plus rapide au plus puissant, choisissez le modèle adapté à vos besoins.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-secondary/30 border border-border/50">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="font-semibold mb-2">Interface conversationnelle</h3>
                <p className="text-sm text-muted-foreground">
                  Décrivez vos miniatures naturellement, comme dans une conversation.
                </p>
              </div>
              <div className="p-6 rounded-xl bg-secondary/30 border border-border/50">
                <div className="text-3xl mb-3">📁</div>
                <h3 className="font-semibold mb-2">Historique complet</h3>
                <p className="text-sm text-muted-foreground">
                  Retrouvez toutes vos conversations et générations passées.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Authenticated view with chat interface
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header 
        isAuthenticated={true}
        userEmail={user.email}
        onLogout={handleLogout}
        onOpenBilling={() => setBillingOpen(true)}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <ConversationSidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onNewConversation={handleNewConversation}
          onSelectConversation={(conv) => {
            selectConversation(conv);
            setMobileSidebarOpen(false); // Close mobile sidebar after selection
          }}
          onDeleteConversation={deleteConversation}
          onOpenBilling={() => {
            setBillingOpen(true);
            setMobileSidebarOpen(false); // Close mobile sidebar when opening billing
          }}
          remainingGemini={getRemainingForModel('google/gemini-2.5-flash-image-preview')}
          remainingPro={getRemainingForModel('google/gemini-3-pro-image-preview')}
          isAuthenticated={true}
          mobileOpen={mobileSidebarOpen}
          onMobileOpenChange={setMobileSidebarOpen}
        />

        <ChatArea
          messages={messages}
          isGenerating={isGenerating}
          hasConversation={!!currentConversation}
          onSend={handleSendMessage}
          remainingForModel={getRemainingForModel}
          disabled={!currentConversation}
          userId={user?.id}
        />
      </div>

      <BillingDialog
        open={billingOpen}
        onOpenChange={setBillingOpen}
        plans={plans}
        currentPlan={(profile?.subscription_plan as SubscriptionPlan) || 'free'}
        onSubscriptionChange={refetchProfile}
      />
    </div>
  );
}
