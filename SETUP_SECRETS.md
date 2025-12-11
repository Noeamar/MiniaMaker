# 🔐 Configuration des Secrets Supabase

## ⚠️ IMPORTANT

Le fichier `.env` local est **UNIQUEMENT** pour le frontend React.  
Les Edge Functions Supabase utilisent des **secrets** configurés dans le Dashboard Supabase.

## 📋 Étape 1 : Vérifier le fichier .env (Frontend)

Votre fichier `.env` doit contenir :
```bash
VITE_SUPABASE_URL=https://ffpnwmaqhggljrqwziif.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=votre_clé_anon
VITE_SUPABASE_PROJECT_ID=ffpnwmaqhggljrqwziif
```

✅ Ces variables sont déjà configurées dans votre `.env`.

## 📋 Étape 2 : Configurer les Secrets Supabase (Edge Functions)

### 1. Allez dans Supabase Dashboard
- Ouvrez https://supabase.com/dashboard
- Sélectionnez votre projet
- Allez dans **Project Settings** (⚙️) > **Edge Functions** > **Secrets**

### 2. Ajoutez ces secrets (un par un) :

#### a) GOOGLE_API_KEY
```
Nom: GOOGLE_API_KEY
Valeur: votre_clé_api_google
```
**Où trouver** : Google Cloud Console > APIs & Services > Credentials > Créez une clé API

#### b) STRIPE_SECRET_KEY
```
Nom: STRIPE_SECRET_KEY
Valeur: sk_live_votre_clé_secrète_stripe
```
**Où trouver** : Stripe Dashboard > Developers > API keys > Secret key (mode Live)

#### c) STRIPE_WEBHOOK_SECRET
```
Nom: STRIPE_WEBHOOK_SECRET
Valeur: whsec_votre_secret_webhook
```
**Où trouver** : Stripe Dashboard > Developers > Webhooks > Cliquez sur votre webhook > Signing secret

### 3. Vérifiez les secrets automatiques

Ces secrets sont configurés automatiquement par Supabase :
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

## 🧪 Test de Configuration

### Test 1 : Vérifier les secrets Supabase
1. Allez dans Supabase Dashboard > Edge Functions > Secrets
2. Vérifiez que `GOOGLE_API_KEY`, `STRIPE_SECRET_KEY`, et `STRIPE_WEBHOOK_SECRET` sont présents

### Test 2 : Tester la génération
1. Lancez votre app : `npm run dev`
2. Essayez de générer une miniature
3. Si erreur 500, allez dans Supabase Dashboard > Edge Functions > generate-thumbnail > Logs
4. Vérifiez les erreurs dans les logs

## 🐛 Dépannage

### Erreur 500 lors de la génération
- ✅ Vérifiez que `GOOGLE_API_KEY` est configuré dans Supabase Secrets
- ✅ Vérifiez que la clé API Google est valide et active
- ✅ Vérifiez les logs dans Supabase Dashboard

### Erreur avec les plans d'abonnement
- ✅ Vérifiez que `STRIPE_SECRET_KEY` est configuré dans Supabase Secrets
- ✅ Vérifiez que la clé Stripe est en mode Live (pas Test)
- ✅ Appliquez la migration SQL pour ajouter 'basic' et 'standard' à l'enum

### Erreur avec les webhooks Stripe
- ✅ Vérifiez que `STRIPE_WEBHOOK_SECRET` est configuré dans Supabase Secrets
- ✅ Vérifiez que le webhook est configuré dans Stripe Dashboard
