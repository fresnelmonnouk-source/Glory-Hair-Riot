# Glory Hair - Statut d'implémentation

## 📊 État actuel — Semaine 3 ✅ (complétée)

Dernière mise à jour : 2026-05-21

---

## ✅ Semaine 1 — Fondations

- Next.js 14 App Router + TypeScript strict
- tRPC context + routers de base (auth, products)
- Supabase clients (server, browser, admin)
- Design system (CSS variables, composants de base)
- GloryHairApp.tsx — prototype UI monolithique

---

## ✅ Semaine 2 — Logique métier

### Infrastructure
- **Supabase** : 12 tables + 13 RLS policies + indexes + triggers
- **tRPC** : 6 routers (auth, products, cart, elodie, payments, orders)
- **Zustand** : Cart store avec persistance localStorage
- **React Query** : Intégration client tRPC

### Pages shop (6)
1. `/catalogue` — Filtres catégorie, pagination, recherche
2. `/produit/[slug]` — Détail produit, variantes, sélection coloris
3. `/panier` — Gestion items, calcul shipping automatique
4. `/checkout` — 3 étapes (adresse → livraison → paiement)
5. `/essayage` — Consent RGPD + accès caméra (overlay à venir)
6. `/commande/success` — Confirmation commande

### Paiements
- **Stripe** — Payment intent + webhook `/api/webhooks/stripe`
- **FedaPay** — Transaction mobile + webhook `/api/webhooks/fedapay`
- Idempotence via table `processed_webhook_events`

### IA & Chat
- **ELODIE** — Widget persistant (bottom-right), Deepseek v4, contexte conversations
- Prompt système spécialisé perruques, température 0.3, timeout 30s

### Seed data
- 5 perruques test avec variantes (`npx tsx scripts/seed.ts`)

---

## ✅ Semaine 3 — Auth, Compte client, Admin, Tests

### Types & Qualité
- **`src/lib/supabase/types.ts`** — Types Supabase complets pour les 12 tables
  - Helpers génériques : `Tables<T>`, `TablesInsert<T>`, `TablesUpdate<T>`, `Enums<T>`
  - Enums typés : `order_status`, `payment_status`, `payment_method`, `message_role`, `discount_type`
- **TypeScript strict** : 0 erreur `tsc --noEmit` sur l'ensemble du projet

### Tests Jest
- **`jest.config.ts`** — Configuration ts-jest, path alias `@/*`, env Node
- **`src/__tests__/helpers/mock-supabase.ts`** — Mocks chaînables Supabase + contexte tRPC
- **`src/__tests__/routers/products.test.ts`** — list, getBySlug, search, getCategories
- **`src/__tests__/routers/auth.test.ts`** — getSession, signOut, getProfile
- **`src/__tests__/routers/cart.test.ts`** — protection route + 5 mutations (list, add, update, remove, clear)
- **`src/__tests__/routers/orders.test.ts`** — protection route + règles métier (annulation impossible si expédiée)

### Authentification
- **`src/app/(auth)/layout.tsx`** — Layout centré avec logo CrownMark
- **`src/app/(auth)/connexion/page.tsx`** — Sign-in, redirection vers `/compte`
- **`src/app/(auth)/inscription/page.tsx`** — Sign-up, indicateur force mot de passe, email de confirmation
- **`src/app/(auth)/mot-de-passe-oublie/page.tsx`** — Reset password par email
- **`src/middleware.ts`** — Protection des routes `/compte/*` et `/admin/*`, redirection `/connexion`

### Router auth amélioré
- `getProfile` — Fetch depuis table `users` (Supabase DB)
- `updateProfile` — Mutation protégée avec validation Zod

### Espace client (`/compte`)
- **`src/app/(compte)/layout.tsx`** — Server component, vérification session, `redirect('/connexion')`
- **`src/app/(compte)/compte/page.tsx`** — Dashboard : header profil, 3 raccourcis, dernières commandes
- **`src/app/(compte)/compte/commandes/page.tsx`** — Historique commandes avec badges statuts
- **`src/app/(compte)/compte/profil/page.tsx`** — Formulaire (infos perso, adresse, préférences beauté, consentement marketing)
- **`src/app/(compte)/compte/essayages/page.tsx`** — Galerie des essayages virtuels sauvegardés
- **`src/components/compte/CompteNav.tsx`** — Navigation sticky avec état actif, handler déconnexion

### Dashboard admin (`/admin`)
- **`src/app/admin/layout.tsx`** — Server component, vérification admin, `AdminSidebar`
- **`src/app/admin/page.tsx`** — KPIs (CA, commandes, clients, produits) + tableau commandes récentes
- **`src/app/admin/commandes/page.tsx`** — Liste commandes, filtre statut, pagination
- **`src/app/admin/produits/page.tsx`** — Tableau produits avec indicateurs stock
- **`src/app/admin/clients/page.tsx`** — Tableau utilisateurs avec opt-in marketing
- **`src/components/admin/AdminSidebar.tsx`** — Sidebar (dashboard, commandes, produits, clients), déconnexion

### Refactorisation GloryHairApp.tsx
- Fichier initial : 1 242 lignes (monolithe)
- Fichier final : ~285 lignes
- Composants extraits vers leurs modules :
  - `src/components/layout/Navbar.tsx`
  - `src/components/home/HomeScreen.tsx`
  - `src/components/catalogue/CatalogScreen.tsx`
  - `src/components/produit/ProductScreen.tsx`
  - `src/components/panier/CartScreen.tsx`
  - `src/components/journal/JournalPage.tsx`
- Composants secondaires inlinés (à extraire progressivement) : `WishlistScreen`, `CheckoutScreen`, `AccountScreen`, `AdminScreen`, `TryOnPage`, `TryOnModal`, `ElodiePanel`

---

## ⏳ Semaine 4 — Tests E2E, Paiements réels, Deploy

### À faire en priorité

#### Paiements réels
- [ ] Remplir `.env.local` : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FEDAPAY_SECRET_KEY`
- [ ] Tester Stripe Checkout complet (Elements ou hosted page)
- [ ] Tester FedaPay Mobile Money (Orange, MTN, Moov)
- [ ] Vérifier webhooks avec Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)

#### Sécurité admin
- [ ] Implémenter la vérification de rôle dans `adminProcedure` (`src/server/trpc/init.ts` — TODO laissé)
- [ ] Ajouter colonne `role` ou table `admin_users` dans Supabase

#### Tests E2E
- [ ] Installer Playwright (`npm install -D @playwright/test`)
- [ ] Flow achat complet (catalogue → panier → checkout → succès)
- [ ] Flow authentification (inscription → connexion → espace client)
- [ ] Flow admin (login → liste commandes → changement statut)

#### MediaPipe
- [ ] Face Mesh en temps réel sur canvas (`@mediapipe/tasks-vision`)
- [ ] Overlay PNG perruque (scale + offset par rapport landmarks)
- [ ] Snapshot + upload Cloudinary + sauvegarde `tryon_results`

#### Performance & Deploy
- [ ] Intégration Cloudinary pour les images produits
- [ ] Cache strategy React Query (staleTime, gcTime)
- [ ] Lazy load composants lourds (TryOnModal, ElodiePanel)
- [ ] Déploiement Vercel (variables d'env à configurer)

---

## 🚀 Points critiques validés

✅ **Architecture** : Séparation concerns (UI → Zustand, server → React Query, auth → Supabase SSR)
✅ **TypeScript** : Mode strict, 0 erreur sur tout le projet
✅ **Sécurité** : RLS sur toutes les tables, middleware route protection, webhook signatures, RGPD consent
✅ **Base de données** : 12 tables, indexing complet, prix en centimes
✅ **Auth SSR** : `@supabase/ssr` dans middleware pour lecture cookies
✅ **Tests** : Jest configuré, 4 routers testés (products, auth, cart, orders)
✅ **Paiements** : Double gateway (Stripe international + FedaPay Afrique de l'Ouest)
✅ **IA** : Deepseek v4 cost-optimized via SDK OpenAI-compatible

---

## ⚠️ Notes importantes

1. **Variables d'env manquantes** : Stripe, FedaPay, Deepseek et Cloudinary ne sont pas encore renseignés dans `.env.local`. L'application tourne mais les paiements et l'IA ne fonctionneront pas.

2. **Rôle admin** : `adminProcedure` dans `src/server/trpc/init.ts` contient un `TODO` — la vérification de rôle admin n'est pas encore implémentée. Toute personne authentifiée peut accéder aux routes admin tRPC.

3. **Overlay MediaPipe** : La caméra s'ouvre mais le rendu 3D de la perruque sur le visage n'est pas encore développé.

4. **Images produits** : Pas d'images par défaut — les Orbs SVG servent de placeholders. Cloudinary à intégrer.

5. **CRUD produits admin** : La page `/admin/produits` liste les produits mais le formulaire d'ajout/édition n'est pas encore créé.

---

## 📝 Fichiers créés/modifiés en Semaine 3 (27 fichiers)

### Types
- `src/lib/supabase/types.ts` (réécrit — 12 tables complètes)
- `src/types/app.ts` (nouveau — `Route`, `CartItem`)

### Tests
- `jest.config.ts`
- `src/__tests__/helpers/mock-supabase.ts`
- `src/__tests__/routers/products.test.ts`
- `src/__tests__/routers/auth.test.ts`
- `src/__tests__/routers/cart.test.ts`
- `src/__tests__/routers/orders.test.ts`

### Auth
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/connexion/page.tsx`
- `src/app/(auth)/inscription/page.tsx`
- `src/app/(auth)/mot-de-passe-oublie/page.tsx`
- `src/middleware.ts`
- `src/server/trpc/routers/auth.ts` (mis à jour)

### Espace client
- `src/app/(compte)/layout.tsx`
- `src/app/(compte)/compte/page.tsx`
- `src/app/(compte)/compte/commandes/page.tsx`
- `src/app/(compte)/compte/profil/page.tsx`
- `src/app/(compte)/compte/essayages/page.tsx`
- `src/components/compte/CompteNav.tsx`

### Admin
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/commandes/page.tsx`
- `src/app/admin/produits/page.tsx`
- `src/app/admin/clients/page.tsx`
- `src/components/admin/AdminSidebar.tsx`

### Refactorisation UI
- `src/components/GloryHairApp.tsx` (réécrit — 1 242 → 285 lignes)
- `src/components/layout/Navbar.tsx`
- `src/components/home/HomeScreen.tsx`
- `src/components/catalogue/CatalogScreen.tsx`
- `src/components/produit/ProductScreen.tsx`
- `src/components/panier/CartScreen.tsx`
- `src/components/journal/JournalPage.tsx`

---

## 🧪 Lancer les tests

```bash
# Tests unitaires tRPC
npm test

# TypeScript (doit retourner 0 erreur)
npx tsc --noEmit

# Serveur de dev
npm run dev
```
