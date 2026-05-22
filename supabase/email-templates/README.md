# Glory Hair RIOT — Email templates

Collection de templates HTML pour les emails Supabase Auth (collés en Dashboard)
et Resend (envoyés depuis le code via `src/lib/email/send.ts`).

## État d'implémentation

### ✅ Sauvegardés et branchés (Phase 5.5)

| Template | Type | Déclencheur | Status |
|---|---|---|---|
| `email-confirm-signup.html` | Supabase Auth | `signUp()` | 📋 À copier dans Dashboard |
| `email-password-reset.html` | Supabase Auth | `resetPasswordForEmail()` | 📋 À copier dans Dashboard |
| `email-welcome.html` | Resend | 1er login sur /compte (idempotent) | ✅ Branché `/api/email/welcome` |
| `email-order-confirmed.html` | Resend | Checkout réussi | ✅ Branché `/api/checkout` |
| `email-newsletter-confirm.html` | Resend | Form footer newsletter | ✅ Branché `/api/newsletter` |
| `email-password-changed.html` | Resend | `/compte/mot-de-passe` update | ✅ Branché `/api/email/password-changed` |
| `email-admin-new-order.html` | Resend (admin) | Checkout réussi | ✅ Branché `/api/checkout` |

### 📦 À déployer Phase 5.6+ (templates fournis, infra à construire)

| Template | Déclencheur attendu |
|---|---|
| `email-email-change.html` | Supabase `updateUser({ email })` |
| `email-magic-link.html` | Supabase `signInWithOtp()` |
| `email-order-shipped.html` | Admin update status='shipped' |
| `email-order-delivered.html` | Admin update / auto cron |
| `email-order-cancelled.html` | Admin update status='cancelled' |
| `email-cart-abandoned.html` | Cron 24h après dernier add cart |
| `email-loyalty-tier-up.html` | Trigger SQL sur users.tier change |
| `email-birthday.html` | Cron annuel sur users.created_at |
| `email-reward-unlocked.html` | Points >= seuil reward |
| `email-newsletter.html` | Cron mensuel manuel |
| `email-wishlist-restock.html` | Hook stock 0 → >0 |
| `email-vip-drop.html` | Admin manual send VIP audience |
| `email-promo-campaign.html` | Admin manual send |
| `email-tryon-ready.html` | After tryon completion (job long) |
| `email-tryon-shared.html` | Bouton "Partager" essai |
| `email-support-ticket-received.html` | Form /sav/contact submit |
| `email-support-reply.html` | Admin réponse ticket |
| `email-return-authorized.html` | Admin valide demande retour |
| `email-account-deletion.html` | Demande RGPD soumise |
| `email-data-export.html` | Export RGPD prêt |
| `email-admin-low-stock.html` | Cron stock < seuil |
| `email-admin-review-pending.html` | Form review submit (à créer) |

## Étapes manuelles côté Fresnel

### 1. Templates Supabase Auth (5 min)

Dashboard Supabase → **Authentication → Email Templates** :

- **Confirm signup** → Subject : `Confirme ton compte · Glory Hair RIOT` + paste `email-confirm-signup.html`
- **Reset Password** → Subject : `Reset ton mot de passe · Glory Hair RIOT` + paste `email-password-reset.html`
- **Change Email** → paste `email-email-change.html` (optionnel pour MVP)
- **Magic Link** → paste `email-magic-link.html` (optionnel pour MVP)

### 2. Resend setup (10 min)

Le code envoie via Resend SDK. Pré-requis :

1. **Vérifier le domaine** dans Resend Dashboard → Domains → Add `maison-glory.fr` (ou `gloryhair.fr`). Ajoute les enregistrements SPF/DKIM dans le DNS du domaine.
2. Une fois vérifié, mets dans `.env.local` :

```
EMAIL_FROM=Glory Hair RIOT <hello@maison-glory.fr>
EMAIL_ADMIN_TO=hello@maison-glory.fr
```

Sans ces variables, les emails partent depuis `onboarding@resend.dev` (OK pour dev, pas pour prod).

3. (Optionnel) Pour la newsletter avec audience :
```
RESEND_AUDIENCE_ID=xxx (créer une audience dans Resend Dashboard)
```

## Encoding UTF-8 — fix mojibake

Les templates pastés via chat ont parfois des caractères mojibake (`Â·` au lieu de `·`,
`Ã©` au lieu de `é`, etc.). Les **7 templates branchés** ci-dessus ont été tapés en
UTF-8 propre. Pour fixer les autres en bloc, lance ce script PowerShell depuis la racine :

```powershell
# Convert mojibake (UTF-8 read as Windows-1252) to proper UTF-8
Get-ChildItem "supabase\email-templates\*.html" | ForEach-Object {
  $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
  $latin1 = [System.Text.Encoding]::GetEncoding('Windows-1252').GetString($bytes)
  $utf8 = [System.Text.Encoding]::UTF8.GetBytes($latin1)
  [System.IO.File]::WriteAllBytes($_.FullName, $utf8)
}
```

Lance-le UNE FOIS sur les fichiers avec mojibake (pas sur les 7 déjà clean — vérifier avant).

## Architecture envoi (Resend)

`src/lib/email/send.ts` :
- `sendEmail({ to, subject, template, data })` — charge template + substitue `{{ .VarName }}` → `data[VarName]` + envoie
- `sendAdminEmail()` — alias avec `to = EMAIL_ADMIN_TO`
- `renderOrderItemsHTML(items)` — pré-rendu HTML pour les boucles d'items (les templates utilisent `{{ .ItemsHTML }}` au lieu d'un Go-template `{{range}}`)
- Cache des templates en mémoire
- Si `RESEND_API_KEY` absente → log warn et skip (silencieux en dev)
- Si Resend renvoie erreur → log error, retourne `{ ok: false, error }`

Ajouter un nouveau type d'email :

```ts
import { sendEmail } from '@/lib/email/send';

await sendEmail({
  to: 'user@email.com',
  subject: 'Sujet',
  template: 'email-XXX.html',
  data: { UserName: 'Naomi', /* ... */ },
});
```
