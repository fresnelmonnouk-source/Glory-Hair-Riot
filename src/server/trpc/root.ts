import { router } from './init';
import { authRouter } from './routers/auth';
import { productsRouter } from './routers/products';
import { cartRouter } from './routers/cart';
import { elodieRouter } from './routers/elodie';
import { paymentsRouter } from './routers/payments';
import { ordersRouter } from './routers/orders';
import { adminRouter } from './routers/admin';
import { wishlistRouter } from './routers/wishlist';
import { tryonRouter } from './routers/tryon';
import { reviewsRouter } from './routers/reviews';
import { discountsRouter } from './routers/discounts';

export const appRouter = router({
  auth: authRouter,
  products: productsRouter,
  cart: cartRouter,
  elodie: elodieRouter,
  payments: paymentsRouter,
  orders: ordersRouter,
  admin: adminRouter,
  wishlist: wishlistRouter,
  tryon: tryonRouter,
  reviews: reviewsRouter,
  discounts: discountsRouter,
});

export type AppRouter = typeof appRouter;
