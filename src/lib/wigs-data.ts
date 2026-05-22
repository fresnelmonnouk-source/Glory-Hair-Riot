/* Catalogue Glory Hair RIOT — Issue N°01
 * Source de vérité : tryon-live.jsx › LIVE_WIGS
 * 6 modèles physiquement référencés.
 */

export interface Wig {
  id: string;
  num: string;          // 'N°01' … 'N°06'
  name: string;
  cat: string;          // 'Closure' | 'Lace Front' | '360 Lace' | 'Full Lace'
  style: string;        // 'Wavy' | 'Straight' | 'Body Wave'
  tone: string;         // 'Châtain', 'Moka', 'Ginger', 'Plum', 'Argent', 'Blond doré'
  img: string;          // chemin /public — ex: '/images/velours.jpg'
  price: number;        // EUR
  tag?: 'BEST' | 'NEW' | 'HOT' | 'EDIT';
  rating?: number;
  reviews?: number;
}

export const WIGS: Wig[] = [
  { id: 'velours',  num: 'N°01', name: 'Velours 14"',    cat: 'Closure',    style: 'Wavy',      tone: 'Châtain',    img: '/images/velours.jpg',    price: 259, tag: 'BEST', rating: 4.9, reviews: 218 },
  { id: 'mocha',    num: 'N°02', name: 'Moka 20"',       cat: 'Lace Front', style: 'Straight',  tone: 'Moka',       img: '/images/mocha.jpg',      price: 339, tag: 'NEW',  rating: 4.8, reviews: 156 },
  { id: 'ginger',   num: 'N°03', name: 'Ginger 18"',     cat: 'Lace Front', style: 'Wavy',      tone: 'Ginger',     img: '/images/ginger.jpg',     price: 319, tag: 'HOT',  rating: 4.7, reviews: 412 },
  { id: 'bordeaux', num: 'N°04', name: 'Bordeaux 22"',   cat: '360 Lace',   style: 'Body Wave', tone: 'Plum',       img: '/images/bordeaux.jpg',   price: 419, tag: 'NEW',  rating: 4.9, reviews: 67  },
  { id: 'argent',   num: 'N°05', name: 'Argent 18"',     cat: 'Full Lace',  style: 'Straight',  tone: 'Argent',     img: '/images/argent.jpg',     price: 389, tag: 'EDIT', rating: 4.8, reviews: 189 },
  { id: 'creme',    num: 'N°06', name: 'Café Crème 16"', cat: 'Closure',    style: 'Wavy',      tone: 'Blond doré', img: '/images/cafe-creme.jpg', price: 289, tag: 'BEST', rating: 4.9, reviews: 288 },
];

export const WIG_BY_ID: Record<string, Wig> = Object.fromEntries(WIGS.map(w => [w.id, w]));
