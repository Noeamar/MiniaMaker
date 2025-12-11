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
    name: 'BASIC',
    monthly_price: 4.99,
    monthly_limit_gemini: 30,  // MiniaMaker 2
    monthly_limit_pro: 3,       // Pro
    description: '30 générations MiniaMaker 2/mois, 3 générations Pro/mois'
  },
  {
    id: 'plus',
    name: 'PLUS',
    monthly_price: 12.99,
    monthly_limit_gemini: 100,  // MiniaMaker 2
    monthly_limit_pro: 10,      // Pro
    description: '100 générations MiniaMaker 2/mois, 10 générations Pro/mois'
  },
  {
    id: 'pro',
    name: 'PRO',
    monthly_price: 29.99,
    monthly_limit_gemini: 400,  // MiniaMaker 2
    monthly_limit_pro: 30,       // Pro
    description: '400 générations MiniaMaker 2/mois, 30 générations Pro/mois'
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
          description: plan.description,
          metadata: {
            plan_id: plan.id,
            monthly_limit_gemini: plan.monthly_limit_gemini.toString(),
            monthly_limit_pro: plan.monthly_limit_pro.toString()
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

