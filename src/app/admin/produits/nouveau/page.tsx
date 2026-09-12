'use client';

/* Assistant IA — création de produit (demande explicite Fresnel, 2026-09-12).
   Équivalent fonctionnel du wizard IA de Sandy Stylish
   (sandy-stylish/src/components/admin/product-wizard.tsx : Brief →
   Génération → Relecture → Publication), mais RÉÉCRIT pour des perruques :
   celui de Sandy est taillé pour de la bijouterie (garde-fou fraude "or",
   faits pierre/matière) — pas transposable tel quel.

   Pas d'étape Photos (contrairement à Sandy) : GloryHairRiot n'a aucune
   fonctionnalité d'upload/recadrage d'image produit à ce jour (backlog
   séparé, non traité) — les photos restent à ajouter manuellement en base
   comme pour tous les produits actuels, signalé à l'étape finale.

   Le formulaire manuel existant (/admin/produits, bouton "+ Nouveau
   produit") reste inchangé — ce wizard est un chemin ALTERNATIF, pas un
   remplacement (même principe que le ?mode=manuel de Sandy). */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { trpc } from '@/lib/trpc/client';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

const INPUT = 'w-full rounded-sm border border-input bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-faint outline-none focus:border-[color:var(--accent)]';
const LABEL = 'mb-2 block text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted';
const TEXTAREA = `${INPUT} min-h-[100px] resize-y`;

const CATEGORIES = ['Wavy', 'Straight', 'Body Wave', 'Curly', 'Coily'];
const CONSTRUCTIONS = ['Closure', 'Lace Front', '360 Lace', 'Full Lace'];
const TAGS = ['', 'BEST', 'NEW', 'HOT', 'EDIT'];

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

interface Facts {
  name: string;
  category: string;
  constructionType: string;
  length: string;
  color: string;
  hairType: string;
  priceEuros: string;
  stockQuantity: string;
  tag: string;
}

const EMPTY_FACTS: Facts = {
  name: '',
  category: 'Wavy',
  constructionType: 'Closure',
  length: '',
  color: '',
  hairType: '100% cheveux humains Remy',
  priceEuros: '',
  stockQuantity: '0',
  tag: '',
};

interface GeneratedCopy {
  description_fr: string;
  long_description_fr: string;
  meta_description_fr: string;
  name_en: string;
  description_en: string;
  long_description_en: string;
  meta_description_en: string;
}

const STEPS = ['Brief', 'Génération', 'Relecture', 'Publication'] as const;

function StepBar({ current }: { current: number }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                active ? 'border-accent bg-accent text-on-accent' : done ? 'border-accent text-accent' : 'border-hairline text-faint'
              }`}
            >
              {done ? '✓' : n}
            </span>
            <span className={active || done ? 'text-sm text-ink' : 'text-sm text-faint'}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ProductWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [facts, setFacts] = useState<Facts>(EMPTY_FACTS);
  const [copy, setCopy] = useState<GeneratedCopy | null>(null);
  const [reviewLang, setReviewLang] = useState<'fr' | 'en'>('fr');
  const [genError, setGenError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [slug, setSlug] = useState('');

  const generateM = trpc.admin.generateProductCopy.useMutation();
  const createM = trpc.admin.createProduct.useMutation();

  function patch(p: Partial<Facts>) {
    setFacts((f) => ({ ...f, ...p }));
  }

  async function handleBrief(e: FormEvent) {
    e.preventDefault();
    setGenError(null);
    setStep(2);
    generateM.mutate(
      {
        name: facts.name.trim(),
        category: facts.category,
        constructionType: facts.constructionType,
        length: facts.length.trim() || undefined,
        color: facts.color.trim() || undefined,
        hairType: facts.hairType.trim() || undefined,
        priceEuros: Number(facts.priceEuros),
      },
      {
        onSuccess: (data) => {
          setCopy(data);
          setStep(3);
        },
        onError: (err) => {
          setGenError(err.message);
          setStep(1);
        },
      },
    );
  }

  function handlePublish() {
    if (!copy) return;
    createM.mutate(
      {
        slug,
        name: facts.name.trim(),
        base_price: Math.round(Number(facts.priceEuros) * 100),
        category: facts.category,
        description: copy.description_fr,
        long_description: copy.long_description_fr,
        meta_description: copy.meta_description_fr,
        hair_type: facts.hairType.trim() || undefined,
        length: facts.length.trim() || undefined,
        color: facts.color.trim() || undefined,
        construction_type: facts.constructionType,
        tag: facts.tag || undefined,
        stock_quantity: Math.max(0, Math.round(Number(facts.stockQuantity) || 0)),
        active: true,
        translation_en: {
          name: copy.name_en,
          description: copy.description_en,
          long_description: copy.long_description_en,
          meta_description: copy.meta_description_en,
        },
      },
      {
        onSuccess: () => setStep(4),
      },
    );
  }

  const canSubmitBrief =
    facts.name.trim().length >= 2 &&
    Number(facts.priceEuros) > 0 &&
    !generateM.isPending;

  return (
    <div>
      <AdminPageHeader
        title="Nouveau produit"
        sub="Assistant IA — rédige la fiche FR + EN à partir des faits"
        actions={
          <Link href="/admin/produits" className="text-sm text-muted transition-colors hover:text-ink">
            ← Retour à la liste
          </Link>
        }
      />
      <StepBar current={step} />

      {/* ─── Étape 1 : Brief ─── */}
      {step === 1 && (
        <form onSubmit={handleBrief} className="mt-8 max-w-2xl rounded-lg border border-hairline bg-surface p-6 md:p-8">
          <p className="eyebrow">Brief</p>
          <h2 className="display mt-2 text-2xl text-ink">Les faits, rien que les faits.</h2>
          <p className="mt-2 text-sm text-muted">L&apos;IA rédige la fiche à partir de ça, jamais l&apos;inverse.</p>

          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="w-name" className={LABEL}>Nom</label>
              <input
                id="w-name"
                type="text"
                value={facts.name}
                onChange={(e) => {
                  const name = e.target.value;
                  patch({ name });
                  if (!slugTouched) setSlug(slugify(name));
                }}
                placeholder='Ex. Miel 18"'
                className={INPUT}
              />
            </div>

            <div>
              <label htmlFor="w-category" className={LABEL}>Catégorie / texture</label>
              <select id="w-category" value={facts.category} onChange={(e) => patch({ category: e.target.value })} className={INPUT}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="w-construction" className={LABEL}>Type de construction</label>
              <select id="w-construction" value={facts.constructionType} onChange={(e) => patch({ constructionType: e.target.value })} className={INPUT}>
                {CONSTRUCTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="w-length" className={LABEL}>Longueur</label>
              <input id="w-length" type="text" value={facts.length} onChange={(e) => patch({ length: e.target.value })} placeholder='Ex. 18"' className={INPUT} />
            </div>

            <div>
              <label htmlFor="w-color" className={LABEL}>Couleur</label>
              <input id="w-color" type="text" value={facts.color} onChange={(e) => patch({ color: e.target.value })} placeholder="Ex. Châtain" className={INPUT} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="w-hairtype" className={LABEL}>Type de cheveux</label>
              <input id="w-hairtype" type="text" value={facts.hairType} onChange={(e) => patch({ hairType: e.target.value })} className={INPUT} />
            </div>

            <div>
              <label htmlFor="w-price" className={LABEL}>Prix (€)</label>
              <input id="w-price" type="number" min={0} step={1} value={facts.priceEuros} onChange={(e) => patch({ priceEuros: e.target.value })} placeholder="199" className={INPUT} />
            </div>

            <div>
              <label htmlFor="w-stock" className={LABEL}>Stock</label>
              <input id="w-stock" type="number" min={0} step={1} value={facts.stockQuantity} onChange={(e) => patch({ stockQuantity: e.target.value })} className={INPUT} />
            </div>

            <div>
              <label htmlFor="w-tag" className={LABEL}>Étiquette (optionnel)</label>
              <select id="w-tag" value={facts.tag} onChange={(e) => patch({ tag: e.target.value })} className={INPUT}>
                {TAGS.map((t) => <option key={t} value={t}>{t || '(aucune)'}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="w-slug" className={LABEL}>Slug</label>
              <input
                id="w-slug"
                type="text"
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
                className={INPUT}
              />
            </div>
          </div>

          {genError && <p className="mt-5 text-sm text-[color:var(--danger)]">{genError}</p>}

          <button
            type="submit"
            disabled={!canSubmitBrief || !slug}
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-60"
          >
            ✨ Générer la fiche produit
          </button>
        </form>
      )}

      {/* ─── Étape 2 : Génération ─── */}
      {step === 2 && (
        <div className="mt-8 max-w-2xl rounded-lg border border-hairline bg-surface p-10 text-center">
          <p className="text-sm text-muted">L&apos;IA rédige la fiche en français et en anglais…</p>
        </div>
      )}

      {/* ─── Étape 3 : Relecture ─── */}
      {step === 3 && copy && (
        <div className="mt-8 max-w-2xl rounded-lg border border-hairline bg-surface p-6 md:p-8">
          <p className="eyebrow">Relecture</p>
          <h2 className="display mt-2 text-2xl text-ink">Vous gardez la main.</h2>
          <p className="mt-2 text-sm text-muted">Rien n&apos;est publié tant que vous ne validez pas.</p>

          <div className="mt-6 flex gap-1 rounded-sm border border-hairline p-1">
            <button
              type="button"
              onClick={() => setReviewLang('fr')}
              className={`flex-1 rounded-[3px] py-2 text-center text-sm transition-colors ${reviewLang === 'fr' ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'}`}
            >
              Français
            </button>
            <button
              type="button"
              onClick={() => setReviewLang('en')}
              className={`flex-1 rounded-[3px] py-2 text-center text-sm transition-colors ${reviewLang === 'en' ? 'bg-accent text-on-accent' : 'text-muted hover:text-ink'}`}
            >
              English
            </button>
          </div>

          {reviewLang === 'fr' ? (
            <div className="mt-6 flex flex-col gap-5">
              <div>
                <label className={LABEL}>Chapô</label>
                <textarea value={copy.description_fr} onChange={(e) => setCopy({ ...copy, description_fr: e.target.value })} className={TEXTAREA} />
              </div>
              <div>
                <label className={LABEL}>Description complète</label>
                <textarea value={copy.long_description_fr} onChange={(e) => setCopy({ ...copy, long_description_fr: e.target.value })} className={`${TEXTAREA} min-h-[200px]`} />
              </div>
              <div>
                <label className={LABEL}>Meta description (SEO)</label>
                <textarea value={copy.meta_description_fr} onChange={(e) => setCopy({ ...copy, meta_description_fr: e.target.value })} className={TEXTAREA} />
              </div>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-5">
              <div>
                <label className={LABEL}>Name (EN)</label>
                <input value={copy.name_en} onChange={(e) => setCopy({ ...copy, name_en: e.target.value })} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Short description</label>
                <textarea value={copy.description_en} onChange={(e) => setCopy({ ...copy, description_en: e.target.value })} className={TEXTAREA} />
              </div>
              <div>
                <label className={LABEL}>Full description</label>
                <textarea value={copy.long_description_en} onChange={(e) => setCopy({ ...copy, long_description_en: e.target.value })} className={`${TEXTAREA} min-h-[200px]`} />
              </div>
              <div>
                <label className={LABEL}>Meta description (SEO)</label>
                <textarea value={copy.meta_description_en} onChange={(e) => setCopy({ ...copy, meta_description_en: e.target.value })} className={TEXTAREA} />
              </div>
            </div>
          )}

          {createM.error && <p className="mt-5 text-sm text-[color:var(--danger)]">{createM.error.message}</p>}

          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-sm border border-line px-6 py-3 text-sm text-ink transition-colors hover:border-[color:var(--border-accent)]"
            >
              ← Revoir le brief
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={createM.isPending}
              className="inline-flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createM.isPending ? 'Publication…' : 'Publier le produit'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Étape 4 : Publication ─── */}
      {step === 4 && (
        <div className="mt-8 max-w-2xl rounded-lg border border-hairline bg-surface p-10 text-center">
          <h2 className="display text-2xl text-ink">Produit publié.</h2>
          <p className="mt-3 text-sm text-muted">
            Fiche FR + EN créée. Il ne reste qu&apos;à ajouter les photos (pas encore d&apos;upload
            depuis l&apos;admin, à faire manuellement en attendant).
          </p>
          <button
            type="button"
            onClick={() => router.push('/admin/produits')}
            className="mt-6 inline-flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hi"
          >
            Retour à la liste
          </button>
        </div>
      )}
    </div>
  );
}
