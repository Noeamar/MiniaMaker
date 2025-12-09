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
      .order('price_monthly', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
    } else {
      // Cast the features field properly
      const typedPlans: SubscriptionPlanInfo[] = (data || []).map(plan => ({
        ...plan,
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

    const isGemini3 = model.includes('gemini-3');
    const used = isGemini3 ? profile.daily_generations_gemini : profile.daily_generations_nano;
    const limit = isGemini3 ? currentPlan.gemini_daily_limit : currentPlan.nano_daily_limit;

    if (limit === null) return { remaining: -1, limit: null }; // Unlimited
    return { remaining: Math.max(0, limit - used), limit };
  };

  const updateSubscription = async (planType: SubscriptionPlan) => {
    if (!userId) return false;

    // In a real app, this would go through Stripe
    // For now, just update the subscription plan directly
    const { error } = await supabase
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
