import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { ConversationSidebar } from '@/components/ConversationSidebar';
import { ChatArea } from '@/components/ChatArea';
import { BillingDialog } from '@/components/BillingDialog';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useUserProfile } from '@/hooks/useUserProfile';
import { AIModel, FormatSettings, UploadedImage, SubscriptionPlan } from '@/types/thumbnail';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Play, Sparkles } from 'lucide-react';

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
    addMessage 
  } = useConversations(user?.id);
  const { 
    profile, 
    plans, 
    getRemainingGenerations, 
    checkGenerationLimit, 
    incrementGenerationCount,
    updateSubscription 
  } = useUserProfile(user?.id);

  const [isGenerating, setIsGenerating] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);

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
    if (!user) {
      toast.error("Veuillez vous connecter pour générer des miniatures");
      navigate('/auth');
      return;
    }

    // Check generation limit
    const limitCheck = await checkGenerationLimit(model);
    if (!limitCheck.allowed) {
      toast.error(limitCheck.error || "Limite quotidienne atteinte");
      setBillingOpen(true);
      return;
    }

    setIsGenerating(true);

    try {
      // Create conversation if none exists
      let conversation = currentConversation;
      if (!conversation) {
        conversation = await createConversation();
        if (!conversation) {
          toast.error("Erreur lors de la création de la conversation");
          setIsGenerating(false);
          return;
        }
      }

      // Add user message
      await addMessage('user', prompt, [], null, { model, format });

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

      // Call generation API
      const { data, error } = await supabase.functions.invoke('generate-thumbnail', {
        body: { 
          prompt,
          model,
          images: imageUrls,
          format
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
        await addMessage('assistant', "Désolé, une erreur est survenue lors de la génération.");
        return;
      }

      // Increment usage count
      await incrementGenerationCount(model);

      if (data?.thumbnails && data.thumbnails.length > 0) {
        await addMessage(
          'assistant', 
          `Voici ${data.thumbnails.length} miniature${data.thumbnails.length > 1 ? 's' : ''} générée${data.thumbnails.length > 1 ? 's' : ''} !`,
          data.thumbnails,
          model,
          { format }
        );
        toast.success(`${data.thumbnails.length} miniatures générées !`);
      } else {
        await addMessage('assistant', "Aucune miniature n'a pu être générée. Veuillez réessayer avec une description différente.");
        toast.error("Aucune miniature générée.");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur de connexion.");
      await addMessage('assistant', "Erreur de connexion au serveur.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getRemainingForModel = (model: AIModel): number => {
    const { remaining } = getRemainingGenerations(model);
    return remaining;
  };

  // Not authenticated view
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
                Connectez-vous pour commencer.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  <Sparkles className="w-5 h-5" />
                  Commencer gratuitement
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
      />
      
      <div className="flex-1 flex overflow-hidden">
        <ConversationSidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onNewConversation={createConversation}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onOpenBilling={() => setBillingOpen(true)}
          remainingNano={getRemainingForModel('google/gemini-2.5-flash-image-preview')}
          remainingGemini={getRemainingForModel('google/gemini-3-pro-image-preview')}
          isAuthenticated={true}
        />

        <ChatArea
          messages={messages}
          isGenerating={isGenerating}
          hasConversation={!!currentConversation}
          onSend={handleSendMessage}
          remainingForModel={getRemainingForModel}
          disabled={!currentConversation}
        />
      </div>

      <BillingDialog
        open={billingOpen}
        onOpenChange={setBillingOpen}
        plans={plans}
        currentPlan={(profile?.subscription_plan as SubscriptionPlan) || 'free'}
        onSelectPlan={updateSubscription}
      />
    </div>
  );
}
