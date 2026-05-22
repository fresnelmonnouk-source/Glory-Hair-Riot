/* Catalogue Glory Hair RIOT — Issue N°01
 * Source de vérité : tryon-live.jsx › LIVE_WIGS
 * 6 modèles physiquement référencés.
 */

export interface Wig {
  id: string;
  num: string;          // 'N°01' … 'N°06'
  name: string;
  length: number;       // pouces — dérivé du nom, exposé pour filtres
  cat: string;          // 'Closure' | 'Lace Front' | '360 Lace' | 'Full Lace'
  style: string;        // 'Wavy' | 'Straight' | 'Body Wave'
  tone: string;         // 'Châtain', 'Moka', 'Ginger', 'Plum', 'Argent', 'Blond doré'
  img: string;          // chemin /public — ex: '/images/velours.jpg'
  price: number;        // EUR
  tag?: 'BEST' | 'NEW' | 'HOT' | 'EDIT';
  rating?: number;
  reviews?: number;
  swatches: [string, string, string]; // 3 hex — pastilles RIOT sur ProductZineCard
}

export const WIGS: Wig[] = [
  { id: 'velours',  num: 'N°01', name: 'Velours 14"',    length: 14, cat: 'Closure',    style: 'Wavy',      tone: 'Châtain',    img: '/images/velours.jpg',    price: 259, tag: 'BEST', rating: 4.9, reviews: 218, swatches: ['#3a1d10', '#5a3a1e', '#7a4a26'] },
  { id: 'mocha',    num: 'N°02', name: 'Moka 20"',       length: 20, cat: 'Lace Front', style: 'Straight',  tone: 'Moka',       img: '/images/mocha.jpg',      price: 339, tag: 'NEW',  rating: 4.8, reviews: 156, swatches: ['#3a2418', '#5a3a1e', '#8a5a2e'] },
  { id: 'ginger',   num: 'N°03', name: 'Ginger 18"',     length: 18, cat: 'Lace Front', style: 'Wavy',      tone: 'Ginger',     img: '/images/ginger.jpg',     price: 319, tag: 'HOT',  rating: 4.7, reviews: 412, swatches: ['#d36a1a', '#a04a14', '#7a3a10'] },
  { id: 'bordeaux', num: 'N°04', name: 'Bordeaux 22"',   length: 22, cat: '360 Lace',   style: 'Body Wave', tone: 'Plum',       img: '/images/bordeaux.jpg',   price: 419, tag: 'NEW',  rating: 4.9, reviews: 67,  swatches: ['#5a1d28', '#7a2a36', '#3a1418'] },
  { id: 'argent',   num: 'N°05', name: 'Argent 18"',     length: 18, cat: 'Full Lace',  style: 'Straight',  tone: 'Argent',     img: '/images/argent.jpg',     price: 389, tag: 'EDIT', rating: 4.8, reviews: 189, swatches: ['#a9a3a8', '#6e6a70', '#1a1a1a'] },
  { id: 'creme',    num: 'N°06', name: 'Café Crème 16"', length: 16, cat: 'Closure',    style: 'Wavy',      tone: 'Blond doré', img: '/images/cafe-creme.jpg', price: 289, tag: 'BEST', rating: 4.9, reviews: 288, swatches: ['#b8895c', '#8a5a2e', '#d4a878'] },
];

export const WIG_BY_ID: Record<string, Wig> = Object.fromEntries(WIGS.map(w => [w.id, w]));
