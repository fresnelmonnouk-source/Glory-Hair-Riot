'use client';

/* ConsentModal — Essai Live RIOT
 * Conforme à systeme.md §9.6 RGPD :
 *   "Votre photo est transmise à Google/OpenAI pour la génération."
 *   Pas d'entraînement modèle (T&C provider).
 *   Droit à l'oubli sur demande.
 */

interface ConsentModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ isOpen, onAccept, onDecline }: ConsentModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/70 p-4"
    >
      <div
        style={{
          background: '#F4ECD8',
          color: '#0A0A0A',
          border: '3px solid #0A0A0A',
          padding: '28px 26px',
          maxWidth: 520,
          width: '100%',
          transform: 'rotate(-0.6deg)',
          boxShadow: '8px 8px 0 #D4FF3E',
          position: 'relative',
        }}
      >
        {/* Tape washi */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -14,
            left: 30,
            width: 140,
            height: 24,
            background: 'rgba(255,122,26,.7)',
            borderLeft: '1px dashed rgba(0,0,0,.3)',
            borderRight: '1px dashed rgba(0,0,0,.3)',
            transform: 'rotate(-3deg)',
          }}
        />

        {/* Stamp */}
        <div
          style={{
            position: 'absolute',
            top: 18,
            right: -10,
            background: '#FF3D00',
            color: '#F4ECD8',
            fontFamily: 'var(--font-rubik-mono-one),monospace',
            fontSize: 10,
            letterSpacing: '0.16em',
            padding: '6px 10px',
            border: '2px solid #0A0A0A',
            transform: 'rotate(6deg)',
          }}
        >
          RGPD · LIS-MOI
        </div>

        <h2
          id="consent-title"
          style={{
            fontFamily: 'var(--font-anton),Impact,sans-serif',
            fontSize: 42,
            lineHeight: 0.9,
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          On envoie ta photo{' '}
          <em
            style={{
              fontFamily: 'var(--font-yeseva-one),serif',
              fontStyle: 'italic',
              textTransform: 'none',
              color: '#FF7A1A',
            }}
          >
            à une IA.
          </em>
        </h2>

        <p
          style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 14,
            lineHeight: 1.55,
            marginBottom: 18,
          }}
        >
          Pour générer le rendu photo-réaliste, ta photo + la perruque choisie sont
          transmises à <b>Google Gemini</b> (ou <b>OpenAI</b> en backup automatique).
          Tu valides ça, ou tu passes ton chemin.
        </p>

        <div
          style={{
            background: '#FAF7F0',
            border: '2px dashed #0A0A0A',
            padding: '14px 16px',
            marginBottom: 18,
            fontSize: 13,
            fontFamily: 'var(--font-special-elite),monospace',
            lineHeight: 1.55,
          }}
        >
          <p style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 16, marginBottom: 6 }}>
            Ce qu&apos;on fait :
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>→ Envoi sécurisé (HTTPS) au serveur Glory Hair</li>
            <li>→ Appel API Gemini ou OpenAI côté serveur</li>
            <li>→ Image résultat retournée au navigateur</li>
          </ul>

          <p style={{ fontFamily: 'var(--font-permanent-marker),cursive', fontSize: 16, marginTop: 14, marginBottom: 6 }}>
            Ce qu&apos;on ne fait pas :
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li>→ Ta photo ne sert pas à entraîner les IA (T&amp;C provider)</li>
            <li>→ Pas de stockage long terme sans ton accord</li>
            <li>→ Pas de revente, pas de partage</li>
          </ul>
        </div>

        <p
          style={{
            fontFamily: 'var(--font-special-elite),monospace',
            fontSize: 12,
            color: '#5E6A64',
            marginBottom: 18,
          }}
        >
          Droit à l&apos;oubli : tu peux demander la suppression à tout moment depuis
          ton compte (ou par email contact@glory-hair.com).
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onDecline}
            style={{
              flex: 1,
              fontFamily: 'var(--font-rubik-mono-one),sans-serif',
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: 'transparent',
              color: '#0A0A0A',
              border: '3px solid #0A0A0A',
              padding: '14px 18px',
              cursor: 'pointer',
            }}
          >
            ✕ Non merci
          </button>
          <button
            type="button"
            onClick={onAccept}
            style={{
              flex: 1.4,
              fontFamily: 'var(--font-rubik-mono-one),sans-serif',
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              background: '#D4FF3E',
              color: '#0A0A0A',
              border: '3px solid #0A0A0A',
              padding: '14px 18px',
              cursor: 'pointer',
              boxShadow: '5px 5px 0 #FF7A1A',
            }}
          >
            ▶ J&apos;accepte · lance l&apos;essai
          </button>
        </div>
      </div>
    </div>
  );
}
