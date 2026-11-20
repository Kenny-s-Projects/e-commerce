// Mise en page commune des e-mails kclick (même style que le code de connexion :
// webapp/supabase/auth-templates/code-connexion.html). Tout texte venant d'un utilisateur passe par esc().

export const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const money = (n) => `$${(Math.round(Number(n || 0) * 100) / 100).toFixed(2)}`

const MONO = `'JetBrains Mono',Consolas,'Courier New',monospace`
const MUTED = '#5e5b55'

/** Paragraphe (texte déjà échappé ou HTML de confiance) */
export const p = (html, style = '') => `<p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:${MUTED};${style}">${html}</p>`

export const button = (href, label) =>
  `<p style="margin:24px 0 0;"><a href="${esc(href)}" style="display:inline-block;background:#141414;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:8px;font-size:14px;">${esc(label)}</a></p>`

export const orderNumber = (number) =>
  `<p style="margin:0;font-family:${MONO};font-size:13px;letter-spacing:0.12em;color:#86671f;">${esc(number)}</p>`

/** Bloc gris (adresse, code…) */
export const box = (html) => `<div style="margin:18px 0 0;padding:14px 16px;background:#efebe3;border-radius:10px;font-size:14px;line-height:1.6;color:#141414;">${html}</div>`

/**
 * Tableau des articles. lines : [{ name, detail, qty, price, struck }]
 * totals : [{ label, amount, strong }]
 */
export function itemsTable(lines, totals = []) {
  const rows = lines
    .map(
      (l) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #e2ddd3;font-size:14px;line-height:1.45;${l.struck ? `color:${MUTED};text-decoration:line-through;` : ''}">
          ${l.qty} × ${esc(l.name)}${l.detail ? `<br><span style="font-size:12px;color:${MUTED};">${esc(l.detail)}</span>` : ''}
        </td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #e2ddd3;font-family:${MONO};font-size:13px;white-space:nowrap;${l.struck ? `color:${MUTED};text-decoration:line-through;` : ''}">${money(l.price * l.qty)}</td>
      </tr>`,
    )
    .join('')
  const sums = totals
    .map(
      (t) => `<tr>
        <td style="padding:8px 0 0;font-size:14px;${t.strong ? 'color:#141414;font-weight:600;' : `color:${MUTED};`}">${esc(t.label)}</td>
        <td align="right" style="padding:8px 0 0;font-family:${MONO};font-size:13px;${t.strong ? 'color:#141414;font-weight:600;' : `color:${MUTED};`}">${money(t.amount)}</td>
      </tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;border-collapse:collapse;">${rows}${sums}</table>`
}

/** Enveloppe complète : en-tête kclick, carte blanche, pied de page */
export function layout({ lang = 'fr', preheader = '', body }) {
  const footer =
    lang === 'en'
      ? 'kclick · 124 Boulevard du 30 Juin, Gombe, Kinshasa · Reply to this e-mail to reach the concierge.'
      : 'kclick · 124 Boulevard du 30 Juin, Gombe, Kinshasa · Répondez à cet e-mail pour joindre la conciergerie.'
  return `<!doctype html>
<html lang="${lang}">
  <body style="margin:0;padding:0;background:#f6f4ef;font-family:'Jost',Helvetica,Arial,sans-serif;color:#141414;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e2ddd3;border-radius:14px;">
            <tr>
              <td style="padding:28px 32px 4px;">
                <p style="margin:0;font-size:22px;letter-spacing:-0.01em;">kclick</p>
                <p style="margin:4px 0 0;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#86671f;">Kenny’s International</p>
              </td>
            </tr>
            <tr><td style="padding:16px 32px 32px;">${body}</td></tr>
          </table>
          <p style="margin:16px 0 0;max-width:560px;font-size:11px;line-height:1.5;color:${MUTED};">${footer}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export const title = (text) => `<h1 style="margin:14px 0 0;font-size:24px;font-weight:300;line-height:1.25;color:#141414;">${esc(text)}</h1>`
