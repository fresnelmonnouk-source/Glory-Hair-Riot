import { HeroRiot } from '@/components/home/HeroRiot';
import { Manifeste } from '@/components/home/Manifeste';
import { CustomerShow } from '@/components/home/CustomerShow';

export default function Home() {
  return (
    <>
      <HeroRiot />
      <Manifeste />
      <CustomerShow />
    </>
  );
}
