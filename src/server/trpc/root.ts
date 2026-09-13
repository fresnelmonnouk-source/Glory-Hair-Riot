import { router } from './init';
import { authRouter } from './routers/auth';
import { elodieRouter } from './routers/elodie';
import { loyaltyRouter } from './routers/loyalty';
import { ordersRouter } from './routers/orders';
import { adminRouter } from './routers/admin';
import { wishlistRouter } from './routers/wishlist';
import { tryonRouter } from './routers/tryon';
import { reviewsRouter } from './routers/reviews';
import { discountsRouter } from './routers/discounts';
import { messagesRouter } from './routers/messages';
import { siteSettingsRouter } from './routers/site-settings';

// `payments` et `cart` retirés (2026-09-13, audit sécurité) : routers morts
// côté UI (aucun appel front, panier réel = localStorage/Zustand depuis la
// décision session 13) mais toujours vivants côté API tRPC — payments.ts
// permettait à tout client de payer n'importe quelle commande au montant de
// son choix (le webhook ne recompare jamais le montant réel), cart.ts
// acceptait un `price_at_added` arbitraire. Supprimés plutôt que patchés :
// zéro fonctionnalité réelle ne les utilise, aucune raison de les garder
// comme surface d'attaque. `products` retiré le même jour, même raison
// (jamais appelé — le vrai catalogue lit src/lib/wigs/service.ts — et
// portait une injection dans le DSL de filtre PostgREST via `.or()`).
export const appRouter = router({
  auth: authRouter,
  elodie: elodieRouter,
  loyalty: loyaltyRouter,
  orders: ordersRouter,
  admin: adminRouter,
  wishlist: wishlistRouter,
  tryon: tryonRouter,
  reviews: reviewsRouter,
  discounts: discountsRouter,
  messages: messagesRouter,
  siteSettings: siteSettingsRouter,
});

export type AppRouter = typeof appRouter;
