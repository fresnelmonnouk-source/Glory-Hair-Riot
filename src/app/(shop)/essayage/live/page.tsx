import type { Metadata } from 'next';
import { TryonFlow } from '@/components/tryon/TryonFlow';

export const metadata: Metadata = {
  title: 'Essai Live — Glory Hair RIOT',
  description: 'Essaie une perruque sur ta vraie photo. IA photo-réaliste, ~5 secondes, 2 essais offerts.',
};

export default function EssayagePage() {
  return <TryonFlow />;
}
