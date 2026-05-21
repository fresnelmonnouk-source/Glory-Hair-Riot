import { Topbar } from '@/components/ui/Topbar';
import { NavRiot } from '@/components/layout/NavRiot';
import { FooterRiot } from '@/components/layout/FooterRiot';
import { Stamp } from '@/components/ui/Stamp';

export default function Home() {
  return (
    <>
      <Topbar />
      <NavRiot />

      <main className="min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4">
        <div className="relative text-center max-w-2xl">
          <Stamp color="orange" rotate={-6} size="sm" className="mb-6">
            Issue N°01
          </Stamp>

          <h1 className="font-['Anton'] text-[clamp(4rem,15vw,10rem)] text-lime leading-none uppercase">
            GLORY<br />HAIR
          </h1>

          <p className="font-['Special_Elite'] text-paper opacity-60 uppercase tracking-[0.3em] text-sm mt-4">
            Reconstruction en cours — Phase 3
          </p>

          <p className="font-['Caveat'] text-paper opacity-40 text-lg mt-6">
            Le front RIOT arrive bientôt.
          </p>
        </div>
      </main>

      <FooterRiot />
    </>
  );
}
