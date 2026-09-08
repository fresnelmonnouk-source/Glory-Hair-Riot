import { NavRiot } from '@/components/layout/NavRiot';
import { FooterRiot } from '@/components/layout/FooterRiot';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavRiot />
      <main>{children}</main>
      <FooterRiot />
    </>
  );
}
