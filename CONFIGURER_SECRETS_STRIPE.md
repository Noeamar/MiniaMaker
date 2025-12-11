# 🔐 Configuration des Secrets Stripe dans Supabase

## ⚠️ IMPORTANT : Ces secrets doivent être configurés dans Supabase Dashboard, PAS dans .env

## Étapes pour configurer les secrets Stripe :

### 1. Allez dans Supabase Dashboard
- Ouvrez https://supabase.com/dashboard
- Sélectionnez votre projet
- Allez dans **Project Settings** (⚙️) > **Edge Functions** > **Secrets**

### 2. Configurez les secrets suivants :

#### a) STRIPE_SECRET_KEY
```
Nom: STRIPE_SECRET_KEY
Valeur: sk_live_VOTRE_CLE_SECRETE_STRIPE
```

#### b) STRIPE_WEBHOOK_SECRET
```
Nom: STRIPE_WEBHOOK_SECRET
Valeur: whsec_VOTRE_SECRET_WEBHOOK
```

### 3. Vérifiez que GOOGLE_API_KEY est aussi configuré
(Si ce n'est pas déjà fait)

### 4. Redéployez les fonctions Edge (recommandé)
Après avoir configuré les secrets, redéployez les fonctions :
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## ✅ Vérification
Après configuration, testez :
1. La connexion/inscription devrait fonctionner
2. Les plans d'abonnement devraient s'afficher
3. Le paiement Stripe devrait fonctionner
