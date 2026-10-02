import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
export default function Tilt({ children, className = '', max = 8, ...rest }) {
  const x = useMotionValue(0), y = useMotionValue(0)
  const rx = useSpring(useTransform(y, [-.5,.5], [max,-max]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(x, [-.5,.5], [-max,max]), { stiffness: 200, damping: 20 })
  const move = e => { const r = e.currentTarget.getBoundingClientRect(); x.set((e.clientX-r.left)/r.width-.5); y.set((e.clientY-r.top)/r.height-.5) }
  const leave = () => { x.set(0); y.set(0) }
  return <motion.div onMouseMove={move} onMouseLeave={leave} style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }} className={className} {...rest}>{children}</motion.div>
}
