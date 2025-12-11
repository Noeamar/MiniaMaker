# 🔧 Corriger le Problème d'Authentification

## Problème
Erreur "invalid api key" lors de la connexion/inscription.

## Cause
La clé `VITE_SUPABASE_PUBLISHABLE_KEY` dans `.env` ne correspond pas au projet Supabase.

## Solution Rapide

### Étape 1 : Récupérer la vraie clé Supabase

1. Allez dans **https://supabase.com/dashboard**
2. Sélectionnez votre projet **kvdghvvpbwhuhyopylfc**
3. Cliquez sur **Project Settings** (⚙️) en bas à gauche
4. Allez dans l'onglet **API**
5. Dans la section **Project API keys**, trouvez la clé **anon public**
6. Cliquez sur l'icône de copie à côté de la clé **anon public**

### Étape 2 : Mettre à jour le fichier .env

Ouvrez le fichier `.env` et remplacez la ligne `VITE_SUPABASE_PUBLISHABLE_KEY` par :

```bash
VITE_SUPABASE_PUBLISHABLE_KEY="COLLEZ_ICI_LA_CLE_QUE_VOUS_AVEZ_COPIEE"
```

Le fichier `.env` complet devrait ressembler à :
```bash
VITE_SUPABASE_PROJECT_ID="kvdghvvpbwhuhyopylfc"
VITE_SUPABASE_URL="https://kvdghvvpbwhuhyopylfc.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="VOTRE_CLE_ANON_PUBLIC_SUPABASE"
```

### Étape 3 : Redémarrer le serveur

```bash
# Arrêtez le serveur actuel (Ctrl+C)
npm run dev
```

## ✅ Vérification

Après avoir mis à jour la clé :
- ✅ La connexion devrait fonctionner
- ✅ L'inscription devrait fonctionner  
- ✅ Plus d'erreur "invalid api key"

## 🔐 Secrets Stripe (déjà configurés ✅)

Les secrets Stripe ont été configurés dans Supabase :
- ✅ STRIPE_SECRET_KEY configuré
- ✅ STRIPE_WEBHOOK_SECRET configuré

Vous pouvez vérifier avec :
```bash
supabase secrets list
```
