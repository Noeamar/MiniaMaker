# Configuration des Variables d'Environnement

## Variables Frontend (.env)

Le fichier `.env` contient les variables utilisées par le frontend React. Il est déjà configuré avec vos valeurs Supabase.

## Variables Edge Functions (Supabase Secrets)

Les Edge Functions Supabase utilisent des **secrets** configurés dans le Dashboard Supabase, PAS dans le fichier `.env` local.

### Comment configurer les secrets dans Supabase :

1. **Allez dans Supabase Dashboard**
   - Ouvrez votre projet
   - Allez dans **Project Settings** > **Edge Functions** > **Secrets**

2. **Ajoutez les secrets suivants** :

   ```
   GOOGLE_API_KEY=votre_clé_api_google_ici
   STRIPE_SECRET_KEY=sk_live_votre_clé_stripe_ici
   STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook_ici
   ```

3. **Vérifiez que ces secrets sont déjà configurés automatiquement** :
   - `SUPABASE_URL` (configuré automatiquement)
   - `SUPABASE_ANON_KEY` (configuré automatiquement)
   - `SUPABASE_SERVICE_ROLE_KEY` (configuré automatiquement)

### Où trouver vos clés :

- **GOOGLE_API_KEY** : Google Cloud Console > APIs & Services > Credentials
- **STRIPE_SECRET_KEY** : Stripe Dashboard > Developers > API keys > Secret key
- **STRIPE_WEBHOOK_SECRET** : Stripe Dashboard > Developers > Webhooks > Cliquez sur votre webhook > Signing secret

## Vérification

Pour vérifier que tout est configuré :

1. **Frontend** : Vérifiez que `.env` contient `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`
2. **Edge Functions** : Vérifiez dans Supabase Dashboard que les secrets sont bien configurés
3. **Test** : Essayez de générer une miniature - si ça ne marche pas, vérifiez les logs dans Supabase Dashboard > Edge Functions > generate-thumbnail > Logs
