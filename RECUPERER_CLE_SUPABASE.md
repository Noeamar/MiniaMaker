# 🔑 Récupérer la Clé Publique Supabase

## Problème
Le fichier .env contient une clé Supabase qui ne correspond pas au bon projet, ce qui cause l'erreur "invalid api key".

## Solution

### 1. Récupérez la vraie clé depuis Supabase Dashboard

1. Allez dans https://supabase.com/dashboard
2. Sélectionnez votre projet **kvdghvvpbwhuhyopylfc**
3. Allez dans **Project Settings** (⚙️) > **API**
4. Dans la section **Project API keys**, copiez la clé **anon public** (pas la service_role)

### 2. Mettez à jour le fichier .env

Remplacez `VITE_SUPABASE_PUBLISHABLE_KEY` dans `.env` par la vraie clé que vous venez de copier.

Le fichier .env devrait ressembler à :
```bash
VITE_SUPABASE_PROJECT_ID="kvdghvvpbwhuhyopylfc"
VITE_SUPABASE_URL="https://kvdghvvpbwhuhyopylfc.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="votre_vraie_clé_anon_public_ici"
```

### 3. Redémarrez le serveur de développement

Après avoir mis à jour le .env, redémarrez :
```bash
# Arrêtez le serveur (Ctrl+C)
npm run dev
```

## ✅ Vérification

Après avoir mis à jour la clé :
- La connexion devrait fonctionner
- L'inscription devrait fonctionner
- Plus d'erreur "invalid api key"
