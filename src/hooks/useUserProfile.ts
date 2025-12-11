import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, SubscriptionPlanInfo, AIModel, SubscriptionPlan } from '@/types/thumbnail';
import { toast } from 'sonner';

export function useUserProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchPlans();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [userId]);

  const fetchProfile = async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data as UserProfile | null);
    }
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .in('plan_type', ['basic', 'standard', 'pro'] as any) // Only fetch the 3 paid plans
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
    } else {
      // Cast the features field properly and filter to only show basic, standard, pro
      const typedPlans: SubscriptionPlanInfo[] = (data || [])
        .filter(plan => ['basic', 'standard', 'pro'].includes(plan.plan_type as string))
        .map(plan => ({
          ...plan,
          plan_type: plan.plan_type as SubscriptionPlan,
          features: (plan.features as { description: string }) || { description: '' }
        }));
      setPlans(typedPlans);
    }
  };

  const checkGenerationLimit = async (model: AIModel): Promise<{ allowed: boolean; remaining: number; limit: number | null; error?: string }> => {
    if (!userId) {
      return { allowed: false, remaining: 0, limit: 0, error: 'Non connecté' };
    }

    const { data, error } = await supabase.rpc('check_generation_limit', {
      _user_id: userId,
      _model_type: model
    });

    if (error) {
      console.error('Error checking limit:', error);
      return { allowed: false, remaining: 0, limit: 0, error: error.message };
    }

    return data as { allowed: boolean; remaining: number; limit: number | null; error?: string };
  };

  const incrementGenerationCount = async (model: AIModel) => {
    if (!userId) return;

    const { error } = await supabase.rpc('increment_generation_count', {
      _user_id: userId,
      _model_type: model
    });

    if (error) {
      console.error('Error incrementing count:', error);
    } else {
      // Refresh profile to update UI
      fetchProfile();
    }
  };

  const getRemainingGenerations = (model: AIModel): { remaining: number; limit: number | null } => {
    if (!profile) return { remaining: 0, limit: 0 };

    const currentPlan = plans.find(p => p.plan_type === profile.subscription_plan);
    if (!currentPlan) return { remaining: 0, limit: 0 };

    // Determine which counter and limit to use based on model
    let used: number;
    let limit: number | null;
    
    if (model.includes('gemini-3') || model.includes('3-pro')) {
      // Pro model (3.0)
      used = (profile as any).daily_generations_pro || 0;
      if (profile.subscription_plan === 'free') {
        limit = 1;
      } else if (currentPlan.gemini_daily_limit === null) {
        limit = null; // Unlimited
      } else {
        limit = Math.max(1, Math.floor((currentPlan.gemini_daily_limit || 0) / 3));
      }
    } else if (model.includes('2.5') || model.includes('flash-image-preview')) {
      // Medium model (2.5)
      used = (profile as any).daily_generations_medium || 0;
      if (profile.subscription_plan === 'free') {
        limit = 3;
      } else {
        limit = currentPlan.gemini_daily_limit;
      }
    } else {
      // Cheap model (2.0)
      used = (profile as any).daily_generations_cheap || 0;
      if (profile.subscription_plan === 'free') {
        limit = 5;
      } else {
        limit = currentPlan.nano_daily_limit;
      }
    }

    if (limit === null) return { remaining: -1, limit: null }; // Unlimited
    return { remaining: Math.max(0, limit - used), limit };
  };
  const updateSubscription = async (planType: SubscriptionPlan) => {
    if (!userId) return false;

    // In a real app, this would go through Stripe
    // For now, just update the subscription plan directly
    const { error } = await supabase
      .from('profiles')
      .update({ subscription_plan: planType as any })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription:', error);
      toast.error('Erreur lors de la mise à jour de l\'abonnement');
      return false;
    }

    toast.success('Abonnement mis à jour !');
    fetchProfile();
    return true;
  };

  return {
    profile,
    plans,
    loading,
    checkGenerationLimit,
    incrementGenerationCount,
    getRemainingGenerations,
    updateSubscription,
    refetchProfile: fetchProfile
  };
}
