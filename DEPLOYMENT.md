# Guide de Déploiement - MiniaMaker

Ce guide vous explique comment publier votre application MiniaMaker sur internet.

## Option 1 : Vercel (Recommandé) ⭐

Vercel est la meilleure option pour les applications React/Vite. C'est gratuit et très simple.

### Prérequis
- Un compte GitHub (gratuit)
- Votre code doit être sur GitHub

### Étapes

1. **Pousser votre code sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE_USERNAME/miniamaker.git
   git push -u origin main
   ```

2. **Créer un compte Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Cliquez sur "Sign Up" et connectez-vous avec GitHub

3. **Importer votre projet**
   - Cliquez sur "Add New Project"
   - Sélectionnez votre repository GitHub `miniamaker`
   - Vercel détectera automatiquement que c'est un projet Vite

4. **Configurer les variables d'environnement**
   Dans la section "Environment Variables", ajoutez :
   ```
   VITE_SUPABASE_URL=https://kvdghvvpbwhuhyopylfc.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=votre_clé_anon_publique
   ```

5. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez quelques minutes
   - Votre site sera disponible à l'URL : `https://votre-projet.vercel.app`

6. **Configurer un domaine personnalisé (optionnel)**
   - Dans les paramètres du projet → Domains
   - Ajoutez votre domaine

### Mises à jour automatiques
À chaque `git push`, Vercel redéploiera automatiquement votre site !

---

## Option 2 : Netlify

### Étapes

1. **Pousser sur GitHub** (comme ci-dessus)

2. **Créer un compte Netlify**
   - Allez sur [netlify.com](https://netlify.com)
   - Connectez-vous avec GitHub

3. **Importer le projet**
   - "Add new site" → "Import an existing project"
   - Sélectionnez votre repository

4. **Configuration du build**
   - Build command : `npm run build`
   - Publish directory : `dist`

5. **Variables d'environnement**
   - Site settings → Environment variables
   - Ajoutez les mêmes variables que pour Vercel

6. **Déployer**
   - Cliquez sur "Deploy site"

---

## Option 3 : GitHub Pages

### Étapes

1. **Installer gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Modifier package.json**
   Ajoutez dans `package.json` :
   ```json
   {
     "homepage": "https://VOTRE_USERNAME.github.io/miniamaker",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Déployer**
   ```bash
   npm run deploy
   ```

4. **Activer GitHub Pages**
   - Repository → Settings → Pages
   - Source : `gh-pages` branch
   - Votre site sera sur : `https://VOTRE_USERNAME.github.io/miniamaker`

---

## Configuration Supabase pour la production

### 1. Vérifier les URLs autorisées

Dans votre dashboard Supabase :
- Allez dans Settings → Authentication → URL Configuration
- Ajoutez votre URL de production dans "Redirect URLs" :
  ```
  https://votre-site.vercel.app
  https://votre-site.vercel.app/**
  ```

### 2. Vérifier les Edge Functions

Les Edge Functions Supabase fonctionnent déjà en production, pas besoin de configuration supplémentaire.

### 3. Vérifier les secrets

Assurez-vous que tous les secrets sont configurés dans Supabase :
```bash
supabase secrets list
```

Si besoin, configurez-les :
```bash
supabase secrets set GOOGLE_API_KEY=votre_clé
supabase secrets set STRIPE_SECRET_KEY=votre_clé
supabase secrets set STRIPE_WEBHOOK_SECRET=votre_secret
```

---

## Checklist avant déploiement

- [ ] Toutes les variables d'environnement sont configurées
- [ ] Les URLs de redirection Supabase incluent votre domaine de production
- [ ] Les Edge Functions sont déployées (`supabase functions deploy`)
- [ ] Les secrets Supabase sont configurés
- [ ] Le webhook Stripe pointe vers votre URL de production
- [ ] Testez l'authentification en production
- [ ] Testez la génération de miniatures en production

---

## Commandes utiles

### Déployer les Edge Functions
```bash
supabase functions deploy generate-thumbnail
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

### Vérifier les logs en production
```bash
supabase functions logs generate-thumbnail
```

---

## Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Vercel/Netlify
2. Vérifiez les logs Supabase Functions
3. Vérifiez la console du navigateur pour les erreurs

