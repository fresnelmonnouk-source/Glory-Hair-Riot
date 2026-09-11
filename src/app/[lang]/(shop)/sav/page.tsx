import type { Metadata } from 'next';
import { SavRiot } from '@/components/sav/SavRiot';
import { resolvePageLang } from '@/i18n/page-lang';

export const metadata: Metadata = {
  title: 'Aide & SAV · Glory Hair',
  description: 'FAQ, suivi de commande, contact, atelier Paris 9. On répond en 12h.',
};

export default async function SavPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await resolvePageLang(params);
  return <SavRiot lang={lang} />;
}
