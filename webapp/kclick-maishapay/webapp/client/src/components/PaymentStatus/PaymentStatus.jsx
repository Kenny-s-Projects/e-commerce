import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { useT } from '../../i18n/lang.js'
import { formatPrice } from '../../data/houses.js'
import { goToCardPage, paymentStatus, startPayment } from '../../lib/payment.js'
import PhoneField from '../PhoneField/PhoneField.jsx'
import { DEFAULT_CODE, formatPhone, phoneError } from '../PhoneField/phone.js'

const ease = [0.22, 1, 0.36, 1]
const POLL_MS = 3000
const DEFAULT_OPERATORS = ['M-Pesa', 'Orange Money', 'Airtel Money']

/**
 * État du paiement d'une commande (page de commande et suivi).
 *  - mobile money : « Validez sur votre téléphone », compte à rebours, le site interroge toutes les 3 s
 *  - carte : bouton vers la page de paiement sécurisée
 *  - payé : coche ; échec : motif + « Réessayer » (même numéro, ou un autre opérateur / numéro)
 *  - paiement en ligne pas activé : message d'attente (l'équipe confirme à la main)
 *  number · phone (téléphone de la commande) · initial (dernier état connu) · operators · onPaid
 */
export default function PaymentStatus({ number, phone, initial = null, operators = DEFAULT_OPERATORS, onPaid, className = '' }) {
  const t = useT()
  const [state, setState] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [other, setOther] = useState(false) // autre opérateur / autre numéro
  const [operator, setOperator] = useState(operators[0])
  const [momo, setMomo] = useState('')
  const [momoCode, setMomoCode] = useState(DEFAULT_CODE)
  const paidOnce = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const s = await paymentStatus(number, phone)
      setState(s)
      setError('')
      return s
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [number, phone])

  // Premier état (si la page n'en a pas), puis toutes les 3 s tant qu'une demande attend le client
  useEffect(() => {
    if (state) return
    const id = setTimeout(refresh, 0)
    return () => clearTimeout(id)
  }, [state, refresh])
  useEffect(() => {
    if (!state?.waiting) return
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [state?.waiting, refresh])

  useEffect(() => {
    if (state?.status === 'paye' && !paidOnce.current) {
      paidOnce.current = true
      onPaid?.(state)
    }
  }, [state, onPaid])

  const retry = async () => {
    if (busy) return
    let opts = {}
    if (other && state?.method === 'mobile_money') {
      const problem = momo.trim() ? phoneError(momoCode, momo) : null
      if (problem) return setError(t(problem))
      opts = { provider: operator, payerPhone: momo.trim() ? formatPhone(momoCode, momo) : undefined }
    }
    setBusy(true)
    setError('')
    try {
      const s = await startPayment(number, phone, opts)
      setState(s)
      setOther(false)
      if (s.method === 'carte' && s.paymentPage) goToCardPage(s.paymentPage)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!state) return <p className={`text-[13px] text-ink/60 ${className}`}>{error ? t(error) : t('Vérification du paiement…')}</p>

  const amount = formatPrice(state.amount)
  const box = `rounded-xl bg-white/80 px-5 py-4 text-left text-[13px] leading-relaxed text-ink/80 ${className}`

  // Paiement en ligne pas encore activé : l'équipe confirme le paiement à la main
  if (!state.online && state.status !== 'paye')
    return (
      <p className={box}>
        {t('Paiement en attente : notre équipe confirme votre paiement et vous prévient. La préparation commence dès que le paiement est confirmé.')}
      </p>
    )

  return (
    <div className={box} role="status" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <m.div key={`${state.status}-${state.waiting}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }}>
          {state.status === 'paye' ? (
            <p className="flex items-center gap-3 text-[14px] text-[#2f6b40]">
              <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-[#2f6b40] text-[12px] text-white">✓</span>
              {t('Paiement de {p} confirmé. La Maison prépare votre commande.', { p: amount })}
            </p>
          ) : state.waiting && state.method === 'mobile_money' ? (
            <>
              <p className="flex items-center gap-3 text-[14px] text-ink">
                <span aria-hidden className="size-4 shrink-0 animate-spin rounded-full border-2 border-ink/20 border-t-ink" />
                {t('Validez le paiement de {p} sur votre téléphone.', { p: amount })}
              </p>
              <p className="mt-2">
                {t('Une demande {o} a été envoyée au {n} : tapez votre code PIN pour confirmer.', { o: state.provider ?? 'mobile money', n: state.payerPhone ?? '' })}{' '}
                <Countdown until={state.expiresAt} />
              </p>
            </>
          ) : state.waiting && state.method === 'carte' ? (
            <>
              <p className="text-[14px] text-ink">{t('Paiement par carte en attente.')}</p>
              <button type="button" onClick={() => goToCardPage(state.paymentPage)} className="mt-3 h-11 rounded-full bg-ink px-6 text-[13px] text-white">
                {t('Continuer vers le paiement sécurisé')} ⟶
              </button>
            </>
          ) : (
            <>
              {state.status === 'echoue' ? (
                <p className="text-[14px] text-celio">
                  {state.failureReason && state.failureReason !== 'Le paiement n’a pas abouti'
                    ? t('Le paiement n’a pas abouti : {r}.', { r: t(state.failureReason) })
                    : t('Le paiement n’a pas abouti.')}
                </p>
              ) : (
                <p className="text-[14px] text-ink">{t('Paiement de {p} à effectuer.', { p: amount })}</p>
              )}
              {state.canRetry && (
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <button type="button" onClick={retry} disabled={busy} aria-busy={busy} className="h-11 rounded-full bg-ink px-6 text-[13px] text-white disabled:opacity-60">
                    {busy ? t('Envoi…') : state.status === 'echoue' ? t('Réessayer') : t('Payer {p}', { p: amount })}
                  </button>
                  {state.method === 'mobile_money' && (
                    <button type="button" onClick={() => setOther((v) => !v)} aria-expanded={other} className="text-[12px] underline underline-offset-4">
                      {t('Changer d’opérateur ou de numéro')}
                    </button>
                  )}
                </div>
              )}
              {other && state.method === 'mobile_money' && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-[12px]">
                    {t('Opérateur')}
                    <select value={operator} onChange={(e) => setOperator(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-ink/20 bg-white px-3 text-[14px]">
                      {operators.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </label>
                  <div className="text-[12px]">
                    <label htmlFor={`pay-momo-${number}`}>{t('Numéro mobile money')}</label>
                    <PhoneField id={`pay-momo-${number}`} code={momoCode} onCodeChange={setMomoCode} value={momo} onChange={setMomo} className="mt-1 h-11 rounded-lg border border-ink/20 bg-white" />
                  </div>
                </div>
              )}
            </>
          )}
        </m.div>
      </AnimatePresence>
      {state.status !== 'paye' && <p className="mt-3 text-[11px] text-ink/55">{t('Les frais de l’opérateur de paiement sont à la charge du client.')}</p>}
      {error && <p className="mt-2 text-[12px] text-celio">{t(error)}</p>}
    </div>
  )
}

/** Temps restant pour valider la demande (mm:ss) */
function Countdown({ until }) {
  const t = useT()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!until) return null
  const left = Math.max(0, Math.round((new Date(until) - now) / 1000))
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return <span className="font-mono text-ink/60">{t('Temps restant : {t}', { t: `${mm}:${ss}` })}</span>
}
