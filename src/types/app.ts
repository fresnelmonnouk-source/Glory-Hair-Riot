export type Route =
  | 'home'
  | 'catalog'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'auth'
  | 'account'
  | 'wishlist'
  | 'tryon'
  | 'journal';

export interface CartItem {
  id: string;
  name: string;
  cat: string;
  style: string;
  price: number;
  color: string;
  shape: 'round' | 'wavy' | 'curly' | 'long';
  qty: number;
}
