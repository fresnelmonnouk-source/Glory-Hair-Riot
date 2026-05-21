# 🏛️ Glory Hair — Plateforme E-commerce de Perruques Premium

Architecture: Next.js 14 + Supabase + tRPC + Stripe + FedaPay + Deepseek v4

## 🚀 Démarrage rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration des variables d'environnement

Copier `.env.example` en `.env.local` et remplir les clés:

```bash
cp .env.example .env.local
```

Variables requises:
- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Stripe**: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **FedaPay**: `FEDAPAY_SECRET_KEY`, `NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY`, `FEDAPAY_WEBHOOK_SECRET`
- **Deepseek**: `DEEPSEEK_API_KEY`
- **Cloudinary**: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 3. Configurer la base de données

Appliquer les migrations Supabase:

```bash
npx supabase migration up
```

Ou manuellement:
1. Aller sur votre projet Supabase
2. SQL Editor → New Query
3. Copier le contenu de `supabase/migrations/001_initial_schema.sql`
4. Exécuter

### 4. Seeder les données de test

```bash
npx tsx scripts/seed.ts
```

Cela ajoutera 5 perruques de test avec variantes.

### 5. Lancer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur `http://localhost:3000`

## 📁 Structure du projet

```
src/
├── app/                    # Next.js 14 App Router
│   ├── (shop)/            # Pages publiques (catalogue, produit, panier, etc.)
│   ├── (auth)/            # Authentification
│   ├── (compte)/          # Espace client
│   ├── admin/             # Dashboard admin
│   ├── api/               # Routes API (webhooks, tRPC)
│   └── layout.tsx         # Layout racine
├── server/
│   ├── trpc/              # Configuration tRPC
│   │   ├── context.ts     # Contexte tRPC (user + supabase)
│   │   ├── init.ts        # Initialisation (publicProcedure, protectedProcedure)
│   │   ├── root.ts        # Root router
│   │   └── routers/       # Routeurs par domaine
│   └── services/          # Services métier
│       ├── payment/       # Stripe + FedaPay
│       ├── elodie/        # Agent IA (Deepseek)
│       └── storage/       # Cloudinary
├── lib/
│   ├── trpc/              # Client tRPC + provider
│   ├── supabase/          # Clients Supabase
│   └── utils/             # Utilitaires (prix, cn, etc.)
├── components/            # Composants React
│   ├── ui/               # Composants design fournis
│   ├── tryon/            # Essayage virtuel (MediaPipe)
│   ├── elodie/           # Chat widget ELODIE
│   └── shared/           # Composants partagés
├── stores/               # Zustand stores (state local)
├── hooks/                # Custom React hooks
└── types/                # Types TypeScript
```

## 🛠️ Technologies

### Frontend
- **Next.js 14** - Framework React with App Router
- **React 18** - UI library
- **TypeScript** - Type safety (strict mode)
- **Tailwind CSS** - Styling
- **Zustand** - State management (UI state)
- **React Query** - Server state management
- **tRPC** - Type-safe API
- **Framer Motion** - Animations
- **MediaPipe** - Virtual try-on (Face Mesh)

### Backend
- **Supabase** - PostgreSQL + Auth + Storage + RLS
- **tRPC** - Type-safe API procedures
- **Zod** - Runtime validation
- **Stripe** - Payments (international)
- **FedaPay** - Payments (West Africa)
- **Deepseek v4** - IA agent ELODIE (via OpenAI SDK)
- **Cloudinary** - Image optimization

### Infrastructure
- **Vercel** - Frontend deployment
- **Supabase** - Database + Auth
- **GitHub** - Version control

## 📝 Patterns et conventions

### TypeScript
- ✅ Strict mode enabled (zero implicit `any`)
- ✅ Full type inference on API calls
- ✅ Zod for runtime validation

### API (tRPC)
- ✅ Type-safe end-to-end (client ↔ server)
- ✅ Automatic type generation
- ✅ Built-in error handling
- ✅ Support for nested routers

### Database (Supabase)
- ✅ Row Level Security (RLS) on all tables
- ✅ Proper indexing for performance
- ✅ Soft deletes where applicable
- ✅ Audit timestamps (created_at, updated_at)

### Prices
- ✅ Always stored as CENTS in database
- ✅ Example: 50.00€ = 5000 cents
- ✅ Use `formatPrice()` and `eurosToCents()` helpers

### State Management
- **UI State** → Zustand (modal open, filters selected)
- **Server State** → React Query (products, user data)
- **Local State** → useState (form inputs)

## 🔐 Security

- ✅ Environment variables never exposed to client
- ✅ Service Role Key only used in server routes
- ✅ CORS configured for Supabase
- ✅ Webhook signature verification (Stripe + FedaPay)
- ✅ RGPD compliance (MediaPipe local processing, explicit consent)
- ✅ Idempotency via `processed_webhook_events` table
- ✅ Order isolation via Row Level Security

## 🚀 Déploiement

### Stripe Setup
1. Créer compte sur [stripe.com](https://stripe.com)
2. Récupérer clés API dans Dashboard → Settings
3. Configurer webhook endpoint: `https://votre-domaine/api/webhooks/stripe`
4. Ajouter events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### FedaPay Setup
1. Créer compte sur [fedapay.com](https://fedapay.com)
2. Récupérer clés API dans Settings
3. Configurer webhook endpoint: `https://votre-domaine/api/webhooks/fedapay`

### Deepseek API
1. Créer compte sur [deepseek.com](https://deepseek.com) ou via API provider
2. Récupérer `DEEPSEEK_API_KEY`
3. ELODIE utilisera le modèle `deepseek-chat` (optimization coûts)

## 📋 Semaines de développement

**Semaine 1** ✅ Fondations
- [x] Next.js 14 structure
- [x] TypeScript strict
- [x] Tailwind CSS + palette
- [x] tRPC context + routers
- [x] Supabase clients

**Semaine 2** ✅ Logique métier (complète)
- [x] Supabase migrations + RLS (12 tables + policies)
- [x] Produits router (list, getBySlug, search, getCategories)
- [x] Catalogue page avec filtres + pagination
- [x] Page produit détail avec variants
- [x] Panier (Zustand store + persistance localStorage)
- [x] Page panier avec calcul shipping automatique
- [x] Essayage virtuel (ConsentModal + accès caméra)
- [x] ELODIE chat router + widget (Deepseek v4 intégré)
- [x] Checkout flow (3 steps: adresse, livraison, paiement)
- [x] Stripe webhook (`/api/webhooks/stripe`)
- [x] FedaPay webhook (`/api/webhooks/fedapay`)
- [x] Deepseek v4 API pour ELODIE
- [x] Orders router (list, getById, cancel, updateAddress)
- [x] Seed script pour 5 perruques test

**Semaine 3** ⏳ Checkout + Client
- [ ] Paiements (Stripe + FedaPay)
- [ ] Espace client (profil, commandes, essayages)
- [ ] Admin dashboard
- [ ] Gestion produits (CRUD)

**Semaine 4** ⏳ Tests + Deploy
- [ ] Jest tests (logique métier)
- [ ] E2E tests (Playwright)
- [ ] Performance optimization
- [ ] Vercel deployment
- [ ] Documentation

## 🤝 Contribution

Ce projet suit les standards KODY:
- Commits atomiques format: `[KODY][GloryHair] type: description`
- Tests sur fonctionnalités critiques
- Code comments pour le WHY (pas le WHAT)
- Feature-based folder structure
- No commented code (delete vs. disable)

## 📞 Support

Pour les questions sur l'architecture, voir les fichiers SKILLS_* dans KODY Core.
