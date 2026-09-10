import type { Metadata } from 'next';
import { CheckoutRiot } from '@/components/checkout/CheckoutRiot';


export const metadata: Metadata = {
  title: 'Checkout · Glory Hair',
  description: 'Finalise ta commande en 3 étapes. Livraison 48h offerte, paiement sécurisé Stripe / FedaPay.',
};

export default function CheckoutPage() {
  return <CheckoutRiot />;
}
