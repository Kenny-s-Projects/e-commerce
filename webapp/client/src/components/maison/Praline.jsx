/**
 * Une praline dessinée en CSS, en attendant les photos par référence.
 *  choco : { base, deco: 'gold' | 'drizzle' | 'nut' | 'plain', shape: 'round' | 'square' }
 *  cup   : true → posée dans sa caissette en papier
 *  className : taille (ex. 'size-16')
 */
export default function Praline({ choco, cup = false, className = 'size-16' }) {
  const radius = choco.shape === 'square' ? '22%' : '50%'
  const body = (
    <span
      className="relative block size-full overflow-hidden"
      style={{
        borderRadius: radius,
        background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.32), transparent 38%),
          radial-gradient(circle at 50% 55%, ${choco.base} 55%, color-mix(in srgb, ${choco.base} 70%, black) 100%)`,
        boxShadow: 'inset 0 -6px 12px rgba(0,0,0,0.35), 0 6px 14px rgba(0,0,0,0.25)',
      }}
    >
      {choco.deco === 'drizzle' && (
        <span
          className="absolute inset-0 opacity-70"
          style={{ background: 'repeating-linear-gradient(-35deg, transparent 0 7px, rgba(242,238,225,0.55) 7px 9px)' }}
        />
      )}
      {choco.deco === 'gold' && (
        <span
          className="absolute left-1/2 top-[38%] size-[22%] -translate-x-1/2 rotate-12"
          style={{ background: 'linear-gradient(135deg, #f3dc9b, #c9a96a 60%, #8a6a3a)', borderRadius: '30% 60% 40% 50%' }}
        />
      )}
      {choco.deco === 'nut' && (
        <span
          className="absolute left-1/2 top-1/2 h-[34%] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
          style={{ background: 'radial-gradient(circle at 40% 35%, #e8c9a0, #a8733f)' }}
        />
      )}
    </span>
  )

  if (!cup) return <span className={`block ${className}`}>{body}</span>

  return (
    <span
      className={`grid place-items-center rounded-[18%] p-[9%] ${className}`}
      style={{ background: 'repeating-conic-gradient(from 0deg, #2a1810 0deg 10deg, #3b2418 10deg 20deg)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.5)' }}
    >
      {body}
    </span>
  )
}
