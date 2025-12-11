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
      setProfile(data as unknown as UserProfile | null);
    }
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data, error } = await (supabase as any)
      .from('subscription_plans')
      .select('*')
      .in('plan_type', ['basic', 'standard', 'pro']) // Only fetch the 3 paid plans
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

    const { data, error } = await (supabase as any).rpc('check_generation_limit', {
      _user_id: userId,
      _model_type: model
    });

    if (error) {
      console.error('Error checking limit:', error);
      return { allowed: false, remaining: 0, limit: 0, error: error.message };
    }

    return (data as { allowed: boolean; remaining: number; limit: number | null; error?: string }) || { allowed: false, remaining: 0, limit: 0 };
  };

  const incrementGenerationCount = async (model: AIModel) => {
    if (!userId) return;

    const { error } = await (supabase as any).rpc('increment_generation_count', {
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
    
    if (model.includes('gemini-2.0-basic-lite')) {
      // Cheap model (2.0 Lite) - MiniaMaker Lite
      used = (profile as any).daily_generations_cheap || profile.daily_generations_nano || 0;
      limit = currentPlan.nano_daily_limit;
    } else if (model.includes('gemini-2.5-flash-image-preview')) {
      // Medium model (2.5 Flash) - MiniaMaker 2
      used = (profile as any).daily_generations_medium || profile.daily_generations_gemini || 0;
      limit = currentPlan.gemini_daily_limit;
    } else if (model.includes('gemini-3') || model.includes('3-pro')) {
      // Pro model (3.0) - MiniaMaker Pro
      used = (profile as any).daily_generations_pro || 0;
      if (profile.subscription_plan === 'free') {
        limit = 1;
      } else if (currentPlan.gemini_daily_limit === null) {
        limit = null; // Unlimited
      } else {
        // Pro limit is roughly gemini_daily_limit / 3 for paid plans
        limit = Math.max(1, Math.floor((currentPlan.gemini_daily_limit || 0) / 3));
      }
    } else {
      // Default fallback to medium model
      used = (profile as any).daily_generations_medium || profile.daily_generations_gemini || 0;
      limit = currentPlan.gemini_daily_limit;
    }

    if (limit === null) return { remaining: -1, limit: null }; // Unlimited
    return { remaining: Math.max(0, limit - used), limit };
  };
  const updateSubscription = async (planType: SubscriptionPlan) => {
    if (!userId) return false;

    // In a real app, this would go through Stripe
    // For now, just update the subscription plan directly
    const { error } = await (supabase as any)
      .from('profiles')
      .update({ subscription_plan: planType })
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
