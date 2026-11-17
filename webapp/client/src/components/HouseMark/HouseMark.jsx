/**
 * Logo d'une Maison (ou son nom en texte si elle n'a pas de fichier logo, comme Kyra).
 *  house     : la Maison
 *  onLight   : true sur fond clair → utilise house.logoDark s'il existe (adidas noir)
 *  className : taille (ex. 'h-10'), appliquée au logo ; textClass : taille du nom en texte
 */
export default function HouseMark({ house, onLight = false, className = 'h-10', textClass = 'text-5xl' }) {
  const logo = onLight && house.logoDark ? house.logoDark : house.logo

  if (!logo) {
    return <span className={`font-light leading-[0.8] tracking-[-0.02em] ${textClass}`}>{house.name}</span>
  }
  return <img src={logo} alt={house.name} className={`w-auto object-contain ${className}`} draggable={false} />
}
