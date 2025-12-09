import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown, Infinity } from 'lucide-react';
import { SubscriptionPlanInfo, SubscriptionPlan } from '@/types/thumbnail';
import { cn } from '@/lib/utils';

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: SubscriptionPlanInfo[];
  currentPlan: SubscriptionPlan;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

const planIcons: Record<SubscriptionPlan, React.ReactNode> = {
  free: <Sparkles className="w-6 h-6" />,
  starter: <Zap className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
  unlimited: <Infinity className="w-6 h-6" />
};

const planColors: Record<SubscriptionPlan, string> = {
  free: 'border-muted',
  starter: 'border-blue-500/50',
  pro: 'border-primary/50',
  unlimited: 'border-yellow-500/50'
};

export function BillingDialog({ 
  open, 
  onOpenChange, 
  plans, 
  currentPlan, 
  onSelectPlan 
}: BillingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choisissez votre forfait</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {plans.map((plan) => {
            const isCurrentPlan = plan.plan_type === currentPlan;
            
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
                
                <CardHeader className="text-center pb-2">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-secondary flex items-center justify-center">
                    {planIcons[plan.plan_type]}
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">
                      {plan.price_monthly}€
                    </span>
                    <span className="text-sm">/mois</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>
                        {plan.nano_daily_limit === null 
                          ? 'Nano Banana illimité' 
                          : `${plan.nano_daily_limit} Nano/jour`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>
                        {plan.gemini_daily_limit === null 
                          ? 'Gemini 3 Pro illimité' 
                          : `${plan.gemini_daily_limit} Gemini/jour`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Historique complet</span>
                    </div>
                    {plan.plan_type !== 'free' && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Support prioritaire</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan}
                    onClick={() => onSelectPlan(plan.plan_type)}
                  >
                    {isCurrentPlan ? 'Plan actuel' : 'Choisir'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Les limites sont réinitialisées chaque jour à minuit (UTC).
          Passez à un forfait supérieur à tout moment.
        </p>
      </DialogContent>
    </Dialog>
  );
}
