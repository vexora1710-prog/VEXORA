import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import useCanUse3D from '../hooks/useCanUse3D'
import StaticOrb from '../three/StaticOrb'
const Hero = lazy(() => import('../three/HeroScene'))
const Orbit = lazy(() => import('../three/OrbitScene'))
export default function Lazy3D({ kind = 'hero', className = '' }) {
  const can = useCanUse3D(), ref = useRef(), [seen, setSeen] = useState(kind === 'hero')
  useEffect(() => { if (seen) return; const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { rootMargin: '200px' }); io.observe(ref.current); return () => io.disconnect() }, [seen])
  const C = kind === 'hero' ? Hero : Orbit
  return <div ref={ref} className={className}>{can && seen ? <Suspense fallback={<StaticOrb />}><C /></Suspense> : <StaticOrb />}</div>
}
