# Créer un compte administrateur

Ce guide explique comment créer un compte administrateur avec des générations illimitées.

## Étapes

### 1. Créer l'utilisateur dans Supabase Auth

1. Allez sur votre [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Users**
4. Cliquez sur **"Add User"** ou **"Invite User"**
5. Remplissez le formulaire :
   - **Email** : `noe.amar@icloud.com`
   - **Password** : `Noeamar2209#`
   - **Auto Confirm User** : ✅ Cochez cette case
6. Cliquez sur **"Create User"**

### 2. Exécuter la migration SQL

1. Allez dans **SQL Editor** dans votre Supabase Dashboard
2. Exécutez la migration `20251214000000_create_admin_account.sql` si ce n'est pas déjà fait
3. Ensuite, exécutez cette commande pour définir l'utilisateur comme admin :

```sql
SELECT public.set_user_as_admin('noe.amar@icloud.com');
```

### 3. Vérifier que ça fonctionne

Vous pouvez vérifier que le compte admin est bien configuré :

```sql
SELECT 
  u.email,
  p.subscription_plan,
  p.credits
FROM auth.users u
JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'noe.amar@icloud.com';
```

Vous devriez voir :
- `subscription_plan` = `'admin'`
- `credits` = `999999`

## Fonctionnalités du compte admin

- ✅ Générations illimitées pour tous les modèles (MiniaMaker 2 et Pro)
- ✅ Pas de limite mensuelle ou quotidienne
- ✅ Accès complet à toutes les fonctionnalités

## Notes importantes

- Le mot de passe est stocké en clair dans ce fichier pour référence, mais Supabase le hash automatiquement
- Le compte admin utilise le plan `'admin'` qui a des limites `NULL` (illimité)
- La fonction `check_generation_limit` a été mise à jour pour reconnaître le plan admin et retourner `-1` (illimité) pour les `remaining`

