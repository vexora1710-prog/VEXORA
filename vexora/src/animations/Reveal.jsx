import { motion } from 'framer-motion'
export default function Reveal({ children, delay = 0, className = '', y = 28 }) {
  return <motion.div className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }} transition={{ duration: .6, delay, ease: [.22,1,.36,1] }}>{children}</motion.div>
}
