import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown, Infinity, Loader2, ExternalLink } from 'lucide-react';
import { SubscriptionPlanInfo, SubscriptionPlan } from '@/types/thumbnail';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: SubscriptionPlanInfo[];
  currentPlan: SubscriptionPlan;
  onSubscriptionChange?: () => void;
}

const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
  free: <Sparkles className="w-6 h-6" />,
  basic: <Zap className="w-6 h-6" />,
  plus: <Crown className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
  starter: <Zap className="w-6 h-6" />,
  unlimited: <Infinity className="w-6 h-6" />
};

const planColors: Record<SubscriptionPlan, string> = {
  free: 'border-muted',
  basic: 'border-blue-500/50',
  plus: 'border-primary/50',
  pro: 'border-yellow-500/50',
  starter: 'border-blue-500/50',
  unlimited: 'border-yellow-500/50'
};

export function BillingDialog({ 
  open, 
  onOpenChange, 
  plans, 
  currentPlan,
  onSubscriptionChange
}: BillingDialogProps) {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleSelectPlan = async (planType: SubscriptionPlan) => {
    if (planType === 'free') return;
    
    setLoadingPlan(planType);
    try {
      // planType is already the Stripe plan ID (basic, standard, pro)
      const planId = planType;
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { planId }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url; // Redirect instead of opening in new tab
        toast.success("Redirection vers le paiement...");
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Erreur lors de la création du paiement");
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {}
      });

      if (error) {
        console.error('Portal error:', error);
        throw error;
      }
      
      if (data?.url) {
        // On mobile, ouvrir dans la même fenêtre pour meilleure UX
        if (window.innerWidth < 768) {
          window.location.href = data.url;
        } else {
          window.open(data.url, '_blank');
        }
        toast.success("Redirection vers le portail client...");
      } else {
        throw new Error("Aucune URL reçue du portail client");
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error(error.message || "Erreur d'accès au portail client. Vérifiez que vous avez un abonnement actif.");
    } finally {
      setLoadingPortal(false);
    }
  };

  // Check subscription status when dialog opens
  useEffect(() => {
    if (open && onSubscriptionChange) {
      supabase.functions.invoke('check-subscription').then(({ data }) => {
        if (data?.subscribed) {
          onSubscriptionChange();
        }
      });
    }
  }, [open, onSubscriptionChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl md:text-2xl">Choisissez votre forfait</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-3 md:mt-4">
          {plans.map((plan) => {
            const isCurrentPlan = plan.plan_type === currentPlan;
            const isLoading = loadingPlan === plan.plan_type;
            const isPaid = plan.plan_type !== 'free';
            
            return (
              <Card 
                key={plan.id}
                className={cn(
                  "relative transition-all hover:shadow-lg",
                  planColors[plan.plan_type],
                  isCurrentPlan && "ring-2 ring-primary"
                )}
              >
                {isCurrentPlan && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                    Actuel
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2 px-3 md:px-6">
                  <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
                    {planIcons[plan.plan_type]}
                  </div>
                  <CardTitle className="text-base md:text-lg">{plan.name}</CardTitle>
                  <CardDescription className="text-sm md:text-base">
                    <span className="text-xl md:text-2xl font-bold text-foreground">
                      {plan.price_monthly}€
                    </span>
                    <span className="text-xs md:text-sm">/mois</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 md:space-y-3 px-3 md:px-6 pb-3 md:pb-6">
                  <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>
                        {(plan as any).gemini_monthly_limit === null 
                          ? 'MiniaMaker 2 illimité' 
                          : `${(plan as any).gemini_monthly_limit || plan.gemini_daily_limit || 0} générations MiniaMaker 2/mois`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>
                        {(plan as any).pro_monthly_limit === null 
                          ? 'MiniaMaker Pro illimité' 
                          : `${(plan as any).pro_monthly_limit || 0} générations Pro/mois`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Historique complet</span>
                    </div>
                    {isPaid && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Support prioritaire</span>
                      </div>
                    )}
                  </div>

                  {isCurrentPlan && isPaid ? (
                    <Button 
                      className="w-full gap-2 text-sm md:text-base h-9 md:h-10"
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={loadingPortal}
                    >
                      {loadingPortal ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Chargement...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          <span>Gérer l'abonnement</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full text-sm md:text-base h-9 md:h-10"
                      variant={isCurrentPlan ? "outline" : "default"}
                      disabled={isCurrentPlan || isLoading || !isPaid}
                      onClick={() => handleSelectPlan(plan.plan_type)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span>Chargement...</span>
                        </>
                      ) : isCurrentPlan ? (
                        'Plan actuel'
                      ) : (
                        'Choisir ce plan'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-xs md:text-sm text-muted-foreground mt-3 md:mt-4 px-2">
          Les limites sont réinitialisées chaque mois.
          <br className="md:hidden" />
          Paiement sécurisé via Stripe.
        </p>
      </DialogContent>
    </Dialog>
  );
}
