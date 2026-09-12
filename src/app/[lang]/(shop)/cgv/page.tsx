import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalShell } from '@/components/legal/LegalShell';
import { getBrandSettings, type BrandSettings } from '@/lib/settings/service';
import { resolvePageLang } from '@/i18n/page-lang';

/* CGV — clauses génériques e-commerce français (objet, prix, commande,
   paiement, livraison, rétractation 14j, garanties légales, litiges).
   Contenu de premier jet, PAS un texte juridique final — voir mentions
   légales pour la note complète sur cette limite assumée. Moyens de
   paiement listés (Stripe/FedaPay/paiement à la livraison) reflètent ceux
   réellement câblés dans /api/checkout, pas une liste générique. */

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return lang === 'en'
    ? { title: 'Terms of sale', description: 'Terms and conditions of sale.' }
    : { title: 'Conditions générales de vente', description: 'CGV : commande, paiement, livraison, rétractation, garanties.' };
}

export default async function CgvPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await resolvePageLang(params);
  const brand = await getBrandSettings();
  return lang === 'en' ? <ContentEn brand={brand} lang={lang} /> : <ContentFr brand={brand} lang={lang} />;
}

function ContentFr({ brand, lang }: { brand: BrandSettings; lang: string }) {
  return (
    <LegalShell eyebrow="Conditions générales" title="Conditions générales de vente" updated="Dernière mise à jour : septembre 2026">
      <h2>Objet</h2>
      <p>
        Les présentes conditions régissent les ventes de perruques et accessoires réalisées sur le site {brand.name}
        entre {brand.name} et tout client (particulier ou professionnel) effectuant un achat. Toute commande implique
        l&apos;acceptation pleine et entière des présentes CGV. Voir les{' '}
        <Link href={`/${lang}/mentions-legales`} className="underline hover:text-ink">mentions légales</Link> pour
        l&apos;identification complète de l&apos;éditeur.
      </p>

      <h2>Produits et prix</h2>
      <p>
        Les prix sont indiqués en euros (€), toutes taxes comprises, hors frais de livraison précisés avant validation
        de la commande. {brand.name} se réserve le droit de modifier ses prix à tout moment, les produits étant
        facturés sur la base du tarif en vigueur au moment de la validation de la commande.
      </p>

      <h2>Commande et paiement</h2>
      <p>
        La commande est validée après confirmation du panier, saisie des informations de livraison et choix du mode
        de paiement : carte bancaire (Stripe), mobile money (FedaPay), ou paiement à la livraison selon les zones
        éligibles. Le paiement par carte ou mobile money est débité au moment de la validation de la commande.
      </p>

      <h2>Livraison</h2>
      <p>
        Les délais de livraison indiqués au moment de la commande (standard ou express) sont donnés à titre indicatif.
        {brand.name} ne saurait être tenue responsable d&apos;un retard imputable au transporteur.
      </p>

      <h2>Droit de rétractation</h2>
      <p>
        Conformément aux articles L221-18 et suivants du Code de la consommation, le client dispose d&apos;un délai de
        14 jours à compter de la réception de sa commande pour exercer son droit de rétractation, sans avoir à
        justifier de motif ni à payer de pénalité. Les produits doivent être retournés dans leur état d&apos;origine,
        non portés et non altérés, permettant leur revente.
      </p>

      <h2>Garanties</h2>
      <p>
        Les produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la
        consommation) et de la garantie légale contre les vices cachés (articles 1641 et suivants du Code civil).
      </p>

      <h2>Responsabilité et litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, le client est invité à contacter{' '}
        {brand.name} au préalable en vue d&apos;une résolution amiable
        (<Link href={`/${lang}/sav/contact`} className="underline hover:text-ink">formulaire de contact</Link>). À
        défaut d&apos;accord, les tribunaux compétents seront ceux du ressort du siège social de l&apos;éditeur (voir{' '}
        <Link href={`/${lang}/mentions-legales`} className="underline hover:text-ink">mentions légales</Link>).
      </p>
    </LegalShell>
  );
}

function ContentEn({ brand, lang }: { brand: BrandSettings; lang: string }) {
  return (
    <LegalShell eyebrow="Terms and conditions" title="Terms of sale" updated="Last updated: September 2026">
      <h2>Purpose</h2>
      <p>
        These terms govern the sale of wigs and accessories on the {brand.name} website between {brand.name} and any
        customer (individual or business) making a purchase. Placing an order implies full acceptance of these terms.
        See the{' '}
        <Link href={`/${lang}/mentions-legales`} className="underline hover:text-ink">legal notice</Link> for the
        publisher&apos;s full identification.
      </p>

      <h2>Products and prices</h2>
      <p>
        Prices are shown in euros (€), all taxes included, excluding shipping costs shown before order confirmation.
        {brand.name} reserves the right to change its prices at any time; products are billed at the rate in effect
        when the order is confirmed.
      </p>

      <h2>Order and payment</h2>
      <p>
        The order is confirmed once the cart, delivery details, and payment method are validated: credit card
        (Stripe), mobile money (FedaPay), or cash on delivery where available. Card and mobile money payments are
        charged when the order is confirmed.
      </p>

      <h2>Delivery</h2>
      <p>
        Delivery times shown at checkout (standard or express) are given for guidance only. {brand.name} cannot be
        held liable for a delay caused by the carrier.
      </p>

      <h2>Right of withdrawal</h2>
      <p>
        In accordance with French consumer law (articles L221-18 et seq. of the Code de la consommation), the
        customer has 14 days from receipt of the order to exercise their right of withdrawal, without justification
        or penalty. Products must be returned in their original, unworn, unaltered condition, suitable for resale.
      </p>

      <h2>Warranties</h2>
      <p>
        Products benefit from the legal warranty of conformity and the legal warranty against hidden defects under
        French law.
      </p>

      <h2>Liability and disputes</h2>
      <p>
        These terms are governed by French law. In the event of a dispute, customers are invited to contact{' '}
        {brand.name} first for an amicable resolution (
        <Link href={`/${lang}/sav/contact`} className="underline hover:text-ink">contact form</Link>). Failing an
        agreement, the competent courts will be those of the publisher&apos;s registered office (see the{' '}
        <Link href={`/${lang}/mentions-legales`} className="underline hover:text-ink">legal notice</Link>).
      </p>
    </LegalShell>
  );
}
