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
});

export type AppRouter = typeof appRouter;
