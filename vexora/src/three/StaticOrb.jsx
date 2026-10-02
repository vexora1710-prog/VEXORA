export default function StaticOrb({ label }) {
  return <div className="w-full h-full grid place-items-center" role="img" aria-label={label || 'VEXORA 3D wordmark'}>
    <span className="text-4xl sm:text-5xl font-black tracking-[0.18em] text-cyan" style={{ transform: 'perspective(600px) rotateY(-18deg)', textShadow: '0 3px 0 rgba(109, 196, 255, 0.72), 0 10px 24px rgba(125, 211, 252, 0.26)' }}>VEXORA</span>
  </div>
}
