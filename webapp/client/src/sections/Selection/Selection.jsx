import { useRef, useState } from 'react'
import { m } from 'framer-motion'
import SectionTitle from '../../components/SectionTitle/SectionTitle.jsx'
import CarouselNav from '../../components/CarouselNav/CarouselNav.jsx'
import SelectionCard from '../../components/SelectionCard/SelectionCard.jsx'
import { findProduct } from '../../data/houses.js'

const ease = [0.22, 1, 0.36, 1]

/**
 * La Sélection : carrousel horizontal de grandes cartes, toutes Maisons confondues.
 * Défilement à la souris (flèches), au trackpad ou au doigt ; le compteur suit.
 *  items : [{ id, tone }] (voir data/home.js)
 */
export default function Selection({ items }) {
  const trackRef = useRef(null)
  const [current, setCurrent] = useState(0)

  const products = items.map(({ id, tone }) => ({ product: findProduct(id), tone })).filter((x) => x.product)

  // Largeur d'un pas = largeur d'une carte + l'espace entre deux cartes
  const step = () => {
    const el = trackRef.current
    const card = el.firstElementChild
    return card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 0) : el.clientWidth
  }

  const goTo = (i) => {
    const index = Math.max(0, Math.min(products.length - 1, i))
    trackRef.current.scrollTo({ left: index * step(), behavior: 'smooth' })
  }

  const onScroll = () => {
    const el = trackRef.current
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    setCurrent(atEnd ? products.length - 1 : Math.round(el.scrollLeft / step()))
  }

  return (
    <section className="bg-white py-[clamp(80px,10vw,140px)] text-ink">
      <div className="mb-[clamp(40px,4vw,56px)] flex items-end justify-between gap-8 px-gutter max-sm:flex-col max-sm:items-start">
        <SectionTitle eyebrow="Toutes maisons" title="La" accent="Sélection" accentInline />
        <CarouselNav
          current={current}
          total={products.length}
          onPrev={() => goTo(current - 1)}
          onNext={() => goTo(current + 1)}
        />
      </div>

      {/* Piste : les cartes débordent à droite pour inviter à faire défiler */}
      <m.div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-[clamp(16px,1.8vw,28px)] overflow-x-auto px-gutter scroll-px-[clamp(20px,4vw,64px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {products.map(({ product, tone }) => (
          <m.div
            key={product.id}
            className="w-[clamp(260px,29vw,440px)] shrink-0 snap-start max-sm:w-[78vw]"
            variants={{
              hidden: { opacity: 0, x: 60 },
              show: { opacity: 1, x: 0, transition: { duration: 1, ease } },
            }}
          >
            <SelectionCard product={product} tone={tone} />
          </m.div>
        ))}
      </m.div>
    </section>
  )
}
