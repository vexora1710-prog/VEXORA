import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ArrowRight, Check } from 'lucide-react'
export const grad = h => `linear-gradient(135deg, hsl(${h[0]} 80% 45%), hsl(${h[1]} 80% 30%))`
export default function ProjectModal({ project, onClose, onStart }) {
  useEffect(() => { if (!project) return; const k = e => e.key === 'Escape' && onClose(); addEventListener('keydown', k); document.body.style.overflow = 'hidden'; return () => { removeEventListener('keydown', k); document.body.style.overflow = '' } }, [project])
  return <AnimatePresence>{project && (
    <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label={project.name} onClick={e => e.stopPropagation()} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        className="glass bg-navy/90 rounded-3xl max-w-3xl mx-auto my-10 p-6 sm:p-10 relative">
        <button onClick={onClose} aria-label="Close project" className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10"><X /></button>
        <p className="eyebrow">{project.cat} · Concept / Demo</p>
        <h3 className="text-3xl sm:text-4xl font-bold text-white mt-2">{project.name}</h3>
        <div className="mt-6 grid grid-cols-3 gap-3" role="img" aria-label={`Gallery placeholders for ${project.name}`}>
          {[0, 1, 2].map(i => <div key={i} className="h-24 sm:h-32 rounded-xl border border-white/10" style={{ background: grad([project.hue[0] + i * 25, project.hue[1] + i * 25]) }} />)}
        </div>
        <div className="mt-8 grid sm:grid-cols-2 gap-6 text-sm leading-relaxed">
          <div><h4 className="font-display text-white mb-1">Problem</h4><p>{project.problem}</p></div>
          <div><h4 className="font-display text-white mb-1">Solution</h4><p>{project.solution}</p></div>
          <div><h4 className="font-display text-white mb-2">Features</h4><ul className="space-y-1.5">{project.features.map(f => <li key={f} className="flex gap-2"><Check size={16} className="text-cyan mt-0.5 shrink-0" />{f}</li>)}</ul></div>
          <div><h4 className="font-display text-white mb-2">Technology</h4><div className="flex flex-wrap gap-2">{project.tech.map(t => <span key={t} className="glass rounded-full px-3 py-1 text-xs">{t}</span>)}</div>
            <h4 className="font-display text-white mt-5 mb-1">Project Status</h4><p>Concept / Demo — not a client project.</p></div>
        </div>
        <button className="btn btn-primary mt-8" onClick={() => { onClose(); onStart() }}>Start a Similar Project <ArrowRight size={16} /></button>
      </motion.div></motion.div>)}</AnimatePresence>
}
