export interface Wig {
  id: string;
  name: string;
  cat: string;
  style: string;
  price: number;
  was?: number;
  tag?: 'new' | 'sale' | 'best';
  color: string;
  shape: 'round' | 'wavy' | 'curly' | 'long';
  swatches: string[];
  rating: number;
  reviews: number;
}

export const WIGS: Wig[] = [
  { id:'w1', name:'Aura Lace 18"', cat:'Lace Front', style:'Ondulée', price:289, was:329, tag:'new', color:'var(--hair-1)', shape:'wavy', swatches:['var(--hair-1)','var(--hair-2)','var(--hair-3)','var(--hair-4)'], rating:4.9, reviews:218 },
  { id:'w2', name:'Couronne 22"', cat:'360 Lace', style:'Lisse', price:419, tag:'best', color:'var(--hair-3)', shape:'long', swatches:['var(--hair-2)','var(--hair-3)','var(--hair-4)'], rating:4.8, reviews:347 },
  { id:'w3', name:'Soleil Bouclée 14"', cat:'Full Lace', style:'Bouclée', price:349, color:'var(--hair-4)', shape:'curly', swatches:['var(--hair-3)','var(--hair-4)','var(--hair-5)'], rating:4.7, reviews:156 },
  { id:'w4', name:'Velours 16"', cat:'Closure', style:'Body Wave', price:259, was:299, tag:'sale', color:'var(--hair-2)', shape:'wavy', swatches:['var(--hair-1)','var(--hair-2)','var(--hair-4)','var(--hair-5)'], rating:4.9, reviews:412 },
  { id:'w5', name:'Onyx Lisse 24"', cat:'Lace Front', style:'Lisse', price:389, color:'var(--hair-1)', shape:'long', swatches:['var(--hair-1)','var(--hair-2)'], rating:4.8, reviews:189 },
  { id:'w6', name:'Miel Bouclée 12"', cat:'Headband', style:'Kinky Curly', price:179, tag:'new', color:'var(--hair-3)', shape:'curly', swatches:['var(--hair-2)','var(--hair-3)','var(--hair-4)'], rating:4.6, reviews:94 },
  { id:'w7', name:'Pourpre Wave 20"', cat:'Frontal', style:'Body Wave', price:329, color:'var(--hair-5)', shape:'wavy', swatches:['var(--hair-5)','var(--hair-1)','var(--hair-2)'], rating:4.7, reviews:67 },
  { id:'w8', name:'Aurore Blonde 18"', cat:'Lace Front', style:'Ondulée', price:359, tag:'best', color:'var(--hair-4)', shape:'wavy', swatches:['var(--hair-4)','var(--hair-3)'], rating:4.9, reviews:288 }
];
