import { NavRiot } from '@/components/layout/NavRiot';
import { FooterRiot } from '@/components/layout/FooterRiot';

/* Port structurel 1:1 : chez Sandy, les pages auth n'ont pas de chrome
   dédié — elles vivent dans le layout normal du site (nav + footer),
   comme toute autre page. Remplace l'ancien layout minimal (Topbar seule,
   sans nav/footer) qui isolait le flow auth. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavRiot />
      <main>{children}</main>
      <FooterRiot />
    </>
  );
}
