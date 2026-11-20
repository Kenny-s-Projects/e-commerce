/**
 * Affiché pendant le téléchargement d'une page (chargement à la demande).
 * Un fin trait doré qui avance en haut, et un bloc à la hauteur de l'écran pour que la page ne « saute » pas.
 * Mouvement réduit : trait fixe (voir .page-fallback-bar dans index.css).
 */
export default function PageFallback() {
  return (
    <div className="min-h-[70svh]" role="status" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div className="fixed inset-x-0 top-16 z-40 h-0.5 overflow-hidden bg-gold/15" aria-hidden>
        <div className="page-fallback-bar h-full w-1/3 bg-gold" />
      </div>
    </div>
  )
}
