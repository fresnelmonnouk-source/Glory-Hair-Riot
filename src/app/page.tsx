import { Topbar } from '@/components/ui/Topbar';
import { NavRiot } from '@/components/layout/NavRiot';
import { FooterRiot } from '@/components/layout/FooterRiot';
import { HeroRiot } from '@/components/home/HeroRiot';
import { Manifeste } from '@/components/home/Manifeste';
import { CustomerShow } from '@/components/home/CustomerShow';

export default function Home() {
  return (
    <>
      <Topbar />
      <NavRiot />
      <main className="pt-16">
        <HeroRiot />
        <Manifeste />
        <CustomerShow />
      </main>
      <FooterRiot />
    </>
  );
}
