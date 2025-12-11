# Configuration Stripe pour MiniaMaker

## 📋 Étapes de configuration

### 1. Créer les produits Stripe

Exécutez le script pour créer les produits et prix Stripe :

```bash
cd /Users/noeamar/Documents/MiniaMaker/MiniaMaker
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY node scripts/create-stripe-products.js
```

**⚠️ Important** : Remplacez `sk_live_YOUR_SECRET_KEY` par votre vraie clé secrète Stripe. Vous pouvez la trouver dans votre [Dashboard Stripe](https://dashboard.stripe.com/apikeys) → Settings → API keys → Secret key.

Le script affichera les Price IDs à copier dans `create-checkout-session/index.ts`.

### 2. Mettre à jour les Price IDs

Après avoir exécuté le script, copiez les Price IDs et mettez-les à jour dans :
`supabase/functions/create-checkout-session/index.ts`

```typescript
const PRICE_IDS: Record<string, string> = {
  basic: "price_XXXXX", // Remplacez par le vrai Price ID
  standard: "price_XXXXX", // Remplacez par le vrai Price ID
  pro: "price_XXXXX", // Remplacez par le vrai Price ID
};
```

### 3. Ajouter les valeurs d'enum dans Supabase

Allez dans le SQL Editor de Supabase et exécutez :

```sql
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'basic';
ALTER TYPE public.subscription_plan ADD VALUE IF NOT EXISTS 'standard';
```

Puis insérez les nouveaux plans :

```sql
INSERT INTO public.subscription_plans (name, plan_type, price_monthly, nano_daily_limit, gemini_daily_limit, features) 
VALUES
  ('Basic', 'basic', 15, 10, 1, '{"description": "10 MiniaMaker Lite/jour, 1 MiniaMaker 2/jour"}'::jsonb),
  ('Standard', 'standard', 20, 100, 20, '{"description": "100 MiniaMaker Lite/jour, 20 MiniaMaker 2/jour"}'::jsonb),
  ('Pro', 'pro', 29, 9999, 200, '{"description": "MiniaMaker Lite illimité, 200 MiniaMaker 2/jour"}'::jsonb)
ON CONFLICT (plan_type) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  nano_daily_limit = EXCLUDED.nano_daily_limit,
  gemini_daily_limit = EXCLUDED.gemini_daily_limit,
  features = EXCLUDED.features;
```

### 4. Configurer les secrets Supabase

```bash
supabase secrets set 
```

### 5. Configurer le webhook Stripe

1. Allez sur https://dashboard.stripe.com/webhooks
2. Cliquez sur "Add endpoint"
3. URL : `https://kvdghvvpbwhuhyopylfc.supabase.co/functions/v1/stripe-webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copiez le "Signing secret" et ajoutez-le dans Supabase :

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXX
```

### 6. Déployer les fonctions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase db push
```

## ⚠️ Pourquoi le webhook est nécessaire ?

Le webhook Stripe est **essentiel** car :

1. **Sécurité** : `checkout.session.completed` ne garantit pas que le paiement a réussi (peut être en attente)
2. **Abonnements** : Il faut écouter `customer.subscription.*` pour gérer les créations, mises à jour et annulations
3. **Fiabilité** : Sans webhook, vous ne saurez jamais quand un utilisateur annule son abonnement
4. **Synchronisation** : Le webhook synchronise automatiquement Stripe avec votre base de données

Sans webhook, les utilisateurs pourraient payer mais ne pas avoir accès à leur abonnement, ou vice versa.

