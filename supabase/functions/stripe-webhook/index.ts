import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Stripe plan IDs to Supabase subscription plans
const PLAN_MAPPING: Record<string, string> = {
  basic: 'basic',
  standard: 'standard',
  pro: 'pro',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("[STRIPE-WEBHOOK] STRIPE_WEBHOOK_SECRET not set");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No stripe-signature header");
    }

    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log(`[STRIPE-WEBHOOK] Received event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("[STRIPE-WEBHOOK] Checkout session completed:", session.id);

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
            { expand: ["items.data.price.product"] }
          );

          const userId = session.metadata?.user_id;
          const planId = session.metadata?.plan_id || subscription.metadata?.plan_id;

          if (!userId || !planId) {
            console.error("[STRIPE-WEBHOOK] Missing userId or planId in metadata");
            break;
          }

          const supabasePlan = PLAN_MAPPING[planId] || 'free';
          const priceId = subscription.items.data[0]?.price?.id;
          const customerId = subscription.customer as string;

          // Update user profile
          const { error: updateError } = await supabaseClient
            .from("profiles")
            .update({
              subscription_plan: supabasePlan,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              stripe_price_id: priceId,
            })
            .eq("user_id", userId);

          if (updateError) {
            console.error("[STRIPE-WEBHOOK] Error updating profile:", updateError);
          } else {
            console.log(`[STRIPE-WEBHOOK] Updated user ${userId} to plan ${supabasePlan}`);
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[STRIPE-WEBHOOK] Subscription ${event.type}:`, subscription.id);

        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price?.id;

        // Get product metadata to find plan_id
        const price = await stripe.prices.retrieve(priceId);
        const product = await stripe.products.retrieve(price.product as string);
        const planId = product.metadata?.plan_id;

        if (!planId) {
          console.error("[STRIPE-WEBHOOK] No plan_id in product metadata");
          break;
        }

        const supabasePlan = PLAN_MAPPING[planId] || 'free';

        // Find user by customer_id
        const { data: profile, error: findError } = await supabaseClient
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (findError || !profile) {
          console.error("[STRIPE-WEBHOOK] Could not find user with customer_id:", customerId);
          break;
        }

        // Update profile
        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update({
            subscription_plan: supabasePlan,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
          })
          .eq("user_id", profile.user_id);

        if (updateError) {
          console.error("[STRIPE-WEBHOOK] Error updating profile:", updateError);
        } else {
          console.log(`[STRIPE-WEBHOOK] Updated user ${profile.user_id} to plan ${supabasePlan}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("[STRIPE-WEBHOOK] Subscription deleted:", subscription.id);

        const customerId = subscription.customer as string;

        // Find user by customer_id
        const { data: profile, error: findError } = await supabaseClient
          .from("profiles")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (findError || !profile) {
          console.error("[STRIPE-WEBHOOK] Could not find user with customer_id:", customerId);
          break;
        }

        // Reset to free plan
        const { error: updateError } = await supabaseClient
          .from("profiles")
          .update({
            subscription_plan: 'free',
            stripe_subscription_id: null,
            stripe_price_id: null,
          })
          .eq("user_id", profile.user_id);

        if (updateError) {
          console.error("[STRIPE-WEBHOOK] Error updating profile:", updateError);
        } else {
          console.log(`[STRIPE-WEBHOOK] Reset user ${profile.user_id} to free plan`);
        }
        break;
      }

      default:
        console.log(`[STRIPE-WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[STRIPE-WEBHOOK] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

