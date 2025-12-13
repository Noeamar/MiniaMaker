import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key to bypass RLS and ensure we can read the profile
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error(`Auth error: ${userError?.message || "User not authenticated"}`);
    }

    const user = userData.user;
    console.log("[CUSTOMER-PORTAL] User authenticated:", user.email);

    // Get user profile to find Stripe customer ID
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, subscription_plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("[CUSTOMER-PORTAL] Error fetching profile:", profileError);
      throw new Error(`Erreur lors de la récupération du profil: ${profileError.message}`);
    }

    // If profile doesn't exist, create it
    if (!profile) {
      console.log("[CUSTOMER-PORTAL] Profile not found, creating one...");
      const { data: newProfile, error: createError } = await supabaseClient
        .from("profiles")
        .insert({
          user_id: user.id,
          subscription_plan: 'free',
          credits: 0,
        })
        .select()
        .single();

      if (createError || !newProfile) {
        console.error("[CUSTOMER-PORTAL] Error creating profile:", createError);
        throw new Error("Impossible de créer le profil. Veuillez réessayer.");
      }

      // Use the newly created profile
      profile = newProfile;
    }

    // If no customer ID but user has a subscription, try to find it from Stripe
    if (!profile?.stripe_customer_id) {
      // Check if user has an active subscription plan
      if (profile?.subscription_plan && profile.subscription_plan !== 'free') {
        // Try to find customer by email in Stripe
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
          apiVersion: "2025-08-27.basil",
        });

        try {
          const customers = await stripe.customers.list({
            email: user.email,
            limit: 1,
          });

          if (customers.data.length > 0) {
            const customerId = customers.data[0].id;
            // Update profile with customer ID
            await supabaseClient
              .from("profiles")
              .update({ stripe_customer_id: customerId })
              .eq("user_id", user.id);
            
            // Use the found customer ID
            profile.stripe_customer_id = customerId;
          } else {
            throw new Error("Aucun client Stripe trouvé. Veuillez vous abonner d'abord.");
          }
        } catch (stripeError) {
          console.error("[CUSTOMER-PORTAL] Stripe error:", stripeError);
          throw new Error("Impossible de trouver votre compte Stripe. Veuillez vous abonner d'abord.");
        }
      } else {
        throw new Error("Vous n'avez pas d'abonnement actif. Veuillez vous abonner d'abord.");
      }
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create customer portal session
    // Stripe portal allows users to cancel subscriptions themselves
    // The subscription will be cancelled at period end (cancel_at_period_end = true)
    // User keeps access and credits until the period ends
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/?subscription=updated`,
    });

    console.log("[CUSTOMER-PORTAL] Portal session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[CUSTOMER-PORTAL] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

