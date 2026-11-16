import { motion } from 'framer-motion'

const ease = [0.22, 1, 0.36, 1]

/**
 * Bandeau services : Livraison · Retrait · Paiement · Concierge.
 *  items : [{ label, text, href? }] (voir data/home.js)
 */
export default function Services({ items }) {
  return (
    <section className="bg-[#f3f2ee] px-gutter py-[clamp(40px,5vw,64px)] text-ink">
      <motion.ul
        className="grid grid-cols-4 gap-8 max-[900px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-6"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      >
        {items.map((item) => (
          <motion.li
            key={item.label}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
            }}
          >
            <p className="caps mb-2.5 text-[9px] text-gold">{item.label}</p>
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="border-b border-ink/40 pb-0.5 text-[13px] transition-colors duration-400 hover:border-ink"
              >
                {item.text}
              </a>
            ) : (
              <p className="text-[13px]">{item.text}</p>
            )}
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}
