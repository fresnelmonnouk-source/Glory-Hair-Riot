import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalShell } from '@/components/legal/LegalShell';
import { getBrandSettings, type BrandSettings } from '@/lib/settings/service';
import { resolvePageLang } from '@/i18n/page-lang';

/* Politique de confidentialité — RGPD. Décrit les traitements RÉELS du
   site (compte/commande, essayage virtuel IA, newsletter, cookies) plutôt
   qu'un texte générique déconnecté du code : sous-traitants listés
   (Supabase, Stripe/FedaPay, Resend, Google Gemini/OpenAI) correspondent
   à l'intégration réelle (voir ConsentModal.tsx pour l'essayage). Premier
   jet, à relire par Fresnel/juriste avant mise en avant — même réserve
   que mentions-legales/cgv. */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return lang === 'en'
    ? { title: 'Privacy policy', description: 'How we collect, use, and protect your personal data.' }
    : { title: 'Politique de confidentialité', description: 'Collecte, usage et protection de vos données personnelles.' };
}

export default async function ConfidentialitePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await resolvePageLang(params);
  const brand = await getBrandSettings();
  return lang === 'en' ? <ContentEn brand={brand} lang={lang} /> : <ContentFr brand={brand} lang={lang} />;
}

function ContentFr({ brand, lang }: { brand: BrandSettings; lang: string }) {
  return (
    <LegalShell eyebrow="RGPD" title="Politique de confidentialité" updated="Dernière mise à jour : septembre 2026">
      <h2>Données collectées</h2>
      <p>
        {brand.name} collecte les données nécessaires à la création de compte (nom, e-mail), au traitement des
        commandes (adresse de livraison, téléphone), à l&apos;essayage virtuel par IA (photo, temporairement traitée),
        et à l&apos;inscription à la newsletter (e-mail), sur la base de votre consentement ou de l&apos;exécution du
        contrat de vente.
      </p>

      <h2>Essayage virtuel et intelligence artificielle</h2>
      <p>
        Lorsque vous utilisez l&apos;essayage virtuel, votre photo est transmise à Google Gemini (ou OpenAI en secours
        automatique) pour générer le rendu. Ces prestataires n&apos;utilisent pas vos photos pour entraîner leurs
        modèles. Le détail complet de ce traitement vous est présenté avant chaque essai (fenêtre de consentement).
      </p>

      <h2>Sous-traitants</h2>
      <p>
        Vos données sont hébergées par Supabase Inc. (base de données, comptes). Les paiements sont traités par
        Stripe et FedaPay, qui ne reçoivent que les informations strictement nécessaires à la transaction. Les
        e-mails transactionnels sont envoyés via Resend.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site utilise des cookies techniques nécessaires au fonctionnement (session, panier). Aucun cookie
        publicitaire tiers n&apos;est déposé sans votre consentement préalable.
      </p>

      <h2>Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement,
        d&apos;opposition et de portabilité de vos données. Pour exercer ces droits, contactez-nous via le{' '}
        <Link href={`/${lang}/sav/contact`} className="underline hover:text-ink">formulaire de contact</Link>
        {brand.legalContactEmail && (
          <> ou à <a href={`mailto:${brand.legalContactEmail}`} className="underline hover:text-ink">{brand.legalContactEmail}</a></>
        )}. Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL.
      </p>

      <h2>Conservation des données</h2>
      <p>
        Les données de compte sont conservées tant que le compte est actif. Les données de commande sont conservées
        conformément aux obligations légales de conservation comptable et commerciale.
      </p>
    </LegalShell>
  );
}

function ContentEn({ brand, lang }: { brand: BrandSettings; lang: string }) {
  return (
    <LegalShell eyebrow="GDPR" title="Privacy policy" updated="Last updated: September 2026">
      <h2>Data collected</h2>
      <p>
        {brand.name} collects the data required to create an account (name, e-mail), process orders (delivery
        address, phone), run the AI virtual try-on (photo, processed temporarily), and manage newsletter sign-ups
        (e-mail), based on your consent or the performance of the sales contract.
      </p>

      <h2>Virtual try-on and artificial intelligence</h2>
      <p>
        When you use the virtual try-on, your photo is sent to Google Gemini (or OpenAI as an automatic fallback) to
        generate the render. These providers do not use your photos to train their models. Full details of this
        processing are shown before every try-on (consent screen).
      </p>

      <h2>Sub-processors</h2>
      <p>
        Your data is hosted by Supabase Inc. (database, accounts). Payments are processed by Stripe and FedaPay,
        which only receive the information strictly necessary for the transaction. Transactional e-mails are sent
        via Resend.
      </p>

      <h2>Cookies</h2>
      <p>
        The site uses technical cookies required for it to function (session, cart). No third-party advertising
        cookie is set without your prior consent.
      </p>

      <h2>Your rights</h2>
      <p>
        Under GDPR, you have the right to access, rectify, erase, object to, and port your data. To exercise these
        rights, contact us via the{' '}
        <Link href={`/${lang}/sav/contact`} className="underline hover:text-ink">contact form</Link>
        {brand.legalContactEmail && (
          <> or at <a href={`mailto:${brand.legalContactEmail}`} className="underline hover:text-ink">{brand.legalContactEmail}</a></>
        )}. You may also lodge a complaint with your local data protection authority.
      </p>

      <h2>Data retention</h2>
      <p>
        Account data is retained while the account remains active. Order data is retained in accordance with legal
        accounting and commercial record-keeping obligations.
      </p>
    </LegalShell>
  );
}
