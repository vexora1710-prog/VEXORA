import { motion } from 'framer-motion'

const stars = [
  { left: '14%', top: '16%', size: '8px' },
  { left: '28%', top: '34%', size: '5px' },
  { left: '54%', top: '19%', size: '7px' },
  { left: '68%', top: '44%', size: '6px' },
  { left: '82%', top: '22%', size: '8px' },
  { left: '72%', top: '62%', size: '5px' },
  { left: '42%', top: '72%', size: '6px' },
  { left: '90%', top: '70%', size: '7px' },
  { left: '22%', top: '78%', size: '6px' }
]

export default function Hero() {
  return <section id="home" aria-label="VEXORA home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 grid-bg" aria-hidden="true" />
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {stars.map((star, i) => <span key={i} className="hero-star" style={{ left: star.left, top: star.top, width: star.size, height: star.size }} />)}
    </div>

    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative z-10 px-4">
      <h1 className="hero-word select-none">VEXORA</h1>
    </motion.div>
  </section>
}
