import { HeroRiot } from '@/components/home/HeroRiot';
import { Selection } from '@/components/home/Selection';
import { AdvisorTeaser } from '@/components/home/AdvisorTeaser';
import { ReassuranceBar } from '@/components/ui/ReassuranceBar';
import { resolvePageLang } from '@/i18n/page-lang';

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await resolvePageLang(params);
  return (
    <>
      <HeroRiot lang={lang} />
      <ReassuranceBar />
      <Selection lang={lang} />
      <AdvisorTeaser lang={lang} />
    </>
  );
}
