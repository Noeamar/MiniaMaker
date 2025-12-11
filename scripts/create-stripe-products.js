/**
 * Script pour créer les produits et prix Stripe
 * Usage: STRIPE_SECRET_KEY=sk_... node scripts/create-stripe-products.js
 */

import Stripe from 'stripe';

// Vérifier que la clé API est fournie
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERREUR: STRIPE_SECRET_KEY n\'est pas définie dans les variables d\'environnement');
  console.error('');
  console.error('Usage:');
  console.error('  STRIPE_SECRET_KEY=sk_live_... node scripts/create-stripe-products.js');
  console.error('');
  console.error('Pour obtenir votre clé Stripe:');
  console.error('  1. Allez sur https://dashboard.stripe.com');
  console.error('  2. Settings → API keys');
  console.error('  3. Copiez votre "Secret key"');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    monthly_price: 15,
    daily_limit_nano: 10,
    daily_limit_gemini: 1,
    model: 'google/gemini-2.0-basic-lite'
  },
  {
    id: 'standard',
    name: 'Standard',
    monthly_price: 20,
    daily_limit_nano: 100,
    daily_limit_gemini: 20,
    model: 'google/gemini-2.5-flash-image-preview'
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly_price: 29,
    daily_limit_nano: 9999,
    daily_limit_gemini: 200,
    model: 'google/gemini-3-pro-image-preview'
  }
];

async function createStripeProducts() {
  console.log('🚀 Création des produits Stripe...\n');

  for (const plan of plans) {
    try {
      // Vérifier si le produit existe déjà
      const existingProducts = await stripe.products.list({
        limit: 100,
      });

      let product = existingProducts.data.find(p => p.metadata?.plan_id === plan.id);

      if (!product) {
        // Créer le produit
        product = await stripe.products.create({
          name: `MiniaMaker ${plan.name}`,
          description: `${plan.daily_limit_nano === 9999 ? 'Illimité' : plan.daily_limit_nano} MiniaMaker Lite/jour, ${plan.daily_limit_gemini} MiniaMaker 2/jour`,
          metadata: {
            plan_id: plan.id,
            daily_limit_nano: plan.daily_limit_nano.toString(),
            daily_limit_gemini: plan.daily_limit_gemini.toString(),
            model: plan.model
          }
        });
        console.log(`✅ Produit créé: ${product.name} (${product.id})`);
      } else {
        console.log(`ℹ️  Produit existant: ${product.name} (${product.id})`);
      }

      // Vérifier si le prix existe déjà
      const existingPrices = await stripe.prices.list({
        product: product.id,
        limit: 100,
      });

      let price = existingPrices.data.find(p => 
        p.recurring?.interval === 'month' && 
        p.unit_amount === plan.monthly_price * 100
      );

      if (!price) {
        // Créer le prix mensuel
        price = await stripe.prices.create({
          product: product.id,
          unit_amount: plan.monthly_price * 100,
          currency: 'eur',
          recurring: {
            interval: 'month'
          },
          metadata: {
            plan_id: plan.id
          }
        });
        console.log(`✅ Prix créé: ${plan.monthly_price}€/mois (${price.id})\n`);
      } else {
        console.log(`ℹ️  Prix existant: ${plan.monthly_price}€/mois (${price.id})\n`);
      }

      // Afficher les IDs pour la configuration
      console.log(`📋 Configuration pour ${plan.name}:`);
      console.log(`   Product ID: ${product.id}`);
      console.log(`   Price ID: ${price.id}`);
      console.log(`   À ajouter dans create-checkout: "${plan.id}": "${price.id}"\n`);

    } catch (error) {
      console.error(`❌ Erreur pour ${plan.name}:`, error.message);
    }
  }

  console.log('✨ Terminé !');
}

createStripeProducts().catch(console.error);

