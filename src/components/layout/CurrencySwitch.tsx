'use client';

import { useMoneyFormatter } from '@/lib/currency-client';
import type { Currency } from '@/lib/money';

const OPTIONS: Currency[] = ['EUR', 'XOF', 'USD'];

/* Sélecteur de devise affichée — même vocabulaire visuel que LangSwitch
   (texte/slash, pas de select natif). Affichage uniquement (voir money.ts
   et currency-client.ts) : ne change jamais la devise réellement facturée
   au checkout. */
export function CurrencySwitch() {
  const { currency, setCurrency } = useMoneyFormatter();

  return (
    <div className="flex items-center gap-1.5">
      {OPTIONS.map((c, i) => (
        <span key={c} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-faint">/</span>}
          {c === currency ? (
            <span className="text-ink" aria-current="true">{c}</span>
          ) : (
            <button type="button" onClick={() => setCurrency(c)} className="text-muted transition-colors hover:text-ink">
              {c}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
