import { Topbar } from '@/components/ui/Topbar';
import { NavRiot } from '@/components/layout/NavRiot';
import { FooterRiot } from '@/components/layout/FooterRiot';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      <NavRiot />
      <main>{children}</main>
      <FooterRiot />
    </>
  );
}
