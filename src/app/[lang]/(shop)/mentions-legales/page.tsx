import type { Metadata } from 'next';
import { LegalShell, LegalField } from '@/components/legal/LegalShell';
import { getBrandSettings, type BrandSettings } from '@/lib/settings/service';
import { resolvePageLang } from '@/i18n/page-lang';

/* Mentions légales — structure + identité admin-éditable (settings.brand_*,
   Phase 2a), contenu de clause générique e-commerce français. Explicitement
   PAS un texte final : à relire par Fresnel (idéalement avec un juriste)
   avant mise en avant commerciale réelle — voir plan i18n/rebrand Phase 2c.
   Aucune valeur légale inventée : un champ non renseigné dans /admin/reglages
   affiche "à compléter" plutôt qu'une donnée fictive. */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return lang === 'en'
    ? { title: 'Legal notice', description: 'Publisher identification and hosting information.' }
    : { title: 'Mentions légales', description: 'Identification de l\'éditeur du site et informations d\'hébergement.' };
}

export default async function MentionsLegalesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await resolvePageLang(params);
  const brand = await getBrandSettings();
  return lang === 'en' ? <ContentEn brand={brand} /> : <ContentFr brand={brand} />;
}

function ContentFr({ brand }: { brand: BrandSettings }) {
  return (
    <LegalShell eyebrow="Informations légales" title="Mentions légales" updated="Dernière mise à jour : septembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le présent site est édité par <strong><LegalField value={brand.legalName} missingLabel="raison sociale à compléter" /></strong>
        {brand.legalForm && <>, {brand.legalForm}</>}, immatriculée sous le numéro SIRET{' '}
        <LegalField value={brand.siret} missingLabel="à compléter" />, dont le siège social est situé au{' '}
        <LegalField value={brand.legalAddress} missingLabel="adresse à compléter" />.
      </p>
      <p>
        Nom commercial : <strong>{brand.name}</strong>. Contact :{' '}
        {brand.legalContactEmail ? (
          <a href={`mailto:${brand.legalContactEmail}`} className="underline hover:text-ink">{brand.legalContactEmail}</a>
        ) : (
          <LegalField value={null} missingLabel="e-mail de contact à compléter" />
        )}.
      </p>

      <h2>Directeur de la publication</h2>
      <p>Le directeur de la publication est le représentant légal de <LegalField value={brand.legalName} missingLabel="la société (à compléter)" />.</p>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
        (<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">vercel.com</a>).
        La base de données et les comptes utilisateurs sont hébergés par Supabase Inc.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du site (textes, images, logos, mise en page, code) est protégé au titre du droit
        d&apos;auteur et reste la propriété de <LegalField value={brand.legalName} missingLabel={brand.name} />, sauf
        mention contraire. Toute reproduction sans autorisation préalable est interdite.
      </p>

      <h2>Responsabilité</h2>
      <p>
        {brand.name} s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur ce site, mais ne
        saurait être tenue responsable des erreurs, omissions, ou de l&apos;indisponibilité temporaire du service.
      </p>
    </LegalShell>
  );
}

function ContentEn({ brand }: { brand: BrandSettings }) {
  return (
    <LegalShell eyebrow="Legal information" title="Legal notice" updated="Last updated: September 2026">
      <h2>Site publisher</h2>
      <p>
        This site is published by <strong><LegalField value={brand.legalName} missingLabel="legal entity name to be completed" /></strong>
        {brand.legalForm && <>, {brand.legalForm}</>}, registered under SIRET number{' '}
        <LegalField value={brand.siret} missingLabel="to be completed" />, with registered office at{' '}
        <LegalField value={brand.legalAddress} missingLabel="address to be completed" />.
      </p>
      <p>
        Trading name: <strong>{brand.name}</strong>. Contact:{' '}
        {brand.legalContactEmail ? (
          <a href={`mailto:${brand.legalContactEmail}`} className="underline hover:text-ink">{brand.legalContactEmail}</a>
        ) : (
          <LegalField value={null} missingLabel="contact e-mail to be completed" />
        )}.
      </p>

      <h2>Publication director</h2>
      <p>The publication director is the legal representative of <LegalField value={brand.legalName} missingLabel="the company (to be completed)" />.</p>

      <h2>Hosting</h2>
      <p>
        This site is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA
        (<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">vercel.com</a>).
        The database and user accounts are hosted by Supabase Inc.
      </p>

      <h2>Intellectual property</h2>
      <p>
        All elements of this site (text, images, logos, layout, code) are protected by copyright and remain the
        property of <LegalField value={brand.legalName} missingLabel={brand.name} />, unless stated otherwise.
        Any reproduction without prior authorization is prohibited.
      </p>

      <h2>Liability</h2>
      <p>
        {brand.name} strives to ensure the accuracy of the information published on this site, but cannot be held
        liable for errors, omissions, or temporary unavailability of the service.
      </p>
    </LegalShell>
  );
}
