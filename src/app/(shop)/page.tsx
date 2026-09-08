import { HeroRiot } from '@/components/home/HeroRiot';
import { Selection } from '@/components/home/Selection';
import { AdvisorTeaser } from '@/components/home/AdvisorTeaser';
import { ReassuranceBar } from '@/components/ui/ReassuranceBar';

export default function Home() {
  return (
    <>
      <HeroRiot />
      <ReassuranceBar />
      <Selection />
      <AdvisorTeaser />
    </>
  );
}
