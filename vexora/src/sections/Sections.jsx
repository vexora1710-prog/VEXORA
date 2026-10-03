import { motion, useScroll, useSpring } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight, Check, Instagram, Linkedin, Mail, Phone } from 'lucide-react'
import { TECH, PILLARS, SERVICES, WHY, PROJECTS, PROCESS, PLANS, EMAIL, PHONE, PHONE_TEL } from '../data/content'
import Reveal from '../animations/Reveal'
import Tilt from '../components/Tilt'
import Icon from '../components/Icon'
import Magnetic from '../components/Magnetic'
import { grad } from '../components/ProjectModal'
import ContactForm from '../components/ContactForm'
import Logo from '../components/Logo'

const Sec = ({ id, children, className = '' }) => <section id={id} className={`relative py-24 sm:py-32 ${className}`}><div className="mx-auto max-w-7xl px-5">{children}</div></section>
const Head = ({ eyebrow, title }) => <Reveal className="mb-14 max-w-3xl"><p className="eyebrow">{eyebrow}</p><h2 className="mt-3 text-4xl sm:text-5xl font-bold text-white leading-tight">{title}</h2></Reveal>

export function TechStrip() {
  const items = [...TECH, ...TECH]
  return <section aria-label="Technology" className="border-y border-white/5 py-10 overflow-hidden">
    <p className="text-center eyebrow mb-6 px-5">Powering the next generation of digital experiences</p>
    <div className="flex w-max marquee gap-12" aria-hidden="true">{items.map((t, i) => <span key={i} className="font-display text-2xl text-slate-500 hover:text-white transition whitespace-nowrap">{t}</span>)}</div>
    <ul className="sr-only">{TECH.map(t => <li key={t}>{t}</li>)}</ul></section>
}
export function About() {
  return <Sec id="about"><div className="max-w-5xl">
    <div><Reveal><p className="eyebrow">About VEXORA</p><h2 className="mt-3 text-4xl sm:text-5xl font-bold text-white leading-tight">WE TURN IDEAS INTO <span className="grad-text">DIGITAL PRODUCTS.</span></h2>
      <p className="mt-6 text-slate-400 text-lg">VEXORA is a digital technology company focused on creating modern websites, web applications and AI-powered digital experiences for businesses, startups and creators.</p></Reveal>
      <div className="mt-10 grid sm:grid-cols-3 gap-4">{PILLARS.map(([n, t], i) => <Reveal key={n} delay={i * .1}><div className="glass rounded-2xl p-5"><div className="font-display text-4xl grad-text font-bold">{n}</div><div className="mt-2 text-sm text-white">{t}</div></div></Reveal>)}</div></div>
  </div></Sec>
}
export function Services() {
  return <Sec id="services"><Head eyebrow="Services" title="WHAT WE BUILD" />
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" style={{ perspective: 1200 }}>{SERVICES.map(([ic, t, d], i) => (
      <Reveal key={t} delay={(i % 4) * .08}><Tilt className="glass glow group h-full rounded-2xl p-6 transition-shadow">
        <div className="flex items-center justify-between"><span className="grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-br from-violet/30 to-cyan/20 text-cyan transition group-hover:scale-110 group-hover:rotate-6"><Icon name={ic} size={22} /></span><span className="font-display text-slate-600">0{i + 1}</span></div>
        <h3 className="mt-5 text-lg font-semibold text-white">{t}</h3><p className="mt-2 text-sm text-slate-400">{d}</p></Tilt></Reveal>))}</div></Sec>
}
export function Ecosystem() {
  return <Sec id="ecosystem" className="!py-10"><div className="glass rounded-3xl p-6 sm:p-10">
    <Reveal><p className="eyebrow">The VEXORA ecosystem</p><h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">One bold name. A complete digital ecosystem.</h2><p className="mt-4 text-slate-400">Digital design, engineering and intelligent products, brought together by VEXORA.</p></Reveal>
  </div></Sec>
}
export function Why() {
  return <Sec id="why"><Head eyebrow="Why VEXORA" title="WHY VEXORA?" />
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{WHY.map(([ic, t, d], i) => <Reveal key={t} delay={i * .08}><Tilt className="glass glow h-full rounded-2xl p-6" max={6}>
      <motion.span whileHover={{ rotate: 12, scale: 1.1 }} className="inline-grid place-items-center h-12 w-12 rounded-full border border-violet/40 text-violet"><Icon name={ic} size={22} /></motion.span>
      <h3 className="mt-5 text-lg font-semibold text-white">{t}</h3><p className="mt-2 text-sm text-slate-400">{d}</p></Tilt></Reveal>)}</div></Sec>
}
export function Work({ onOpen }) {
  return <Sec id="work"><Head eyebrow="Portfolio" title="SELECTED WORK" />
    <p className="-mt-8 mb-10 text-sm text-slate-500">All projects below are concept / demo work, not real client projects.</p>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{PROJECTS.map((p, i) => <Reveal key={p.id} delay={(i % 3) * .08}>
      <motion.article whileHover={{ y: -8, scale: 1.01 }} className="group glass rounded-2xl overflow-hidden h-full flex flex-col">
        <div className="relative h-56 overflow-hidden">
          <img src={p.preview} alt={p.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <div className="absolute inset-0" style={{ background: grad(p.hue) }} />
          <img src={p.preview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen" />
          <span className="absolute top-3 left-3 text-[10px] tracking-widest uppercase glass rounded-full px-3 py-1 text-white">Concept / Demo</span>
          <span className="absolute bottom-3 left-4 font-display text-5xl font-bold text-white/30">0{p.id}</span>
        </div>
        <div className="p-6 flex flex-col flex-1"><p className="eyebrow !text-[10px]">{p.cat}</p><h3 className="mt-1 text-xl font-semibold text-white">{p.name}</h3>
          <p className="mt-2 text-sm text-slate-400 flex-1">{p.desc}</p>
          <div className="mt-4 flex flex-wrap gap-2">{p.tech.map(t => <span key={t} className="text-xs text-slate-300 bg-white/5 rounded-full px-2.5 py-1">{t}</span>)}</div>
          <button onClick={() => onOpen(p)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan hover:gap-3 transition-all" aria-label={`View project: ${p.name}`}>View Project <ArrowRight size={16} /></button></div>
      </motion.article></Reveal>)}</div></Sec>
}
export function Process() {
  const ref = useRef(), { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 60%'] })
  const h = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })
  return <Sec id="process"><Head eyebrow="Process" title="FROM IDEA TO LAUNCH" />
    <ol ref={ref} className="relative max-w-3xl mx-auto pl-10">
      <span className="absolute left-3 top-0 bottom-0 w-px bg-white/10" aria-hidden="true" />
      <motion.span className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-violet to-cyan origin-top" style={{ scaleY: h }} aria-hidden="true" />
      {PROCESS.map(([t, d], i) => <Reveal key={t} className="relative pb-12 last:pb-0"><span className="absolute -left-[34px] top-1 grid place-items-center h-6 w-6 rounded-full bg-ink border border-violet text-[10px] text-cyan">{i + 1}</span>
        <p className="eyebrow">Step 0{i + 1}</p><h3 className="text-2xl font-bold text-white mt-1">{t}</h3><p className="mt-1 text-slate-400">{d}</p></Reveal>)}</ol></Sec>
}
export function Pricing({ onStart, onPayPlan }) {
  return <Sec id="pricing"><Head eyebrow="Pricing" title="SIMPLE. TRANSPARENT. FLEXIBLE." />
    <div className="grid lg:grid-cols-3 gap-6 items-stretch">{PLANS.map((p, i) => <Reveal key={p.name} delay={i * .1} className="h-full"><Tilt max={4} className={`h-full rounded-3xl p-8 flex flex-col glass ${p.hot ? 'border-violet/60 shadow-[0_0_60px_-15px_rgba(139,92,246,.6)]' : ''}`}>
      {p.hot && <span className="self-start text-[10px] tracking-widest uppercase bg-violet/30 text-white rounded-full px-3 py-1 mb-3">Most popular</span>}
      <h3 className="font-display tracking-widest text-slate-400">{p.name}</h3>
      <p className="mt-3 text-sm text-slate-500">Starting from</p><p className="text-4xl font-bold text-white font-display">{p.price}</p><p className="mt-2 text-slate-400">{p.note}</p>
      <ul className="mt-6 space-y-2.5 flex-1">{p.items.map(x => <li key={x} className="flex gap-2 text-sm"><Check size={16} className="text-cyan mt-0.5 shrink-0" />{x}</li>)}</ul>
      <button onClick={() => p.payable ? onPayPlan(p) : onStart(`Plan: ${p.name}`)} className={`btn mt-8 ${p.hot ? 'btn-primary' : 'btn-ghost'}`}>{p.cta}</button></Tilt></Reveal>)}</div>
    <p className="mt-8 text-center text-sm text-slate-500">Final pricing depends on project requirements and scope.</p></Sec>
}
export function Contact() {
  return <Sec id="contact"><div className="grid lg:grid-cols-2 gap-12">
    <Reveal><p className="eyebrow">Contact</p><h2 className="mt-3 text-4xl sm:text-5xl font-bold text-white leading-tight">LET'S BUILD SOMETHING GREAT.</h2>
      <p className="mt-5 text-slate-400 text-lg">Have an idea? Tell us what you want to build.</p>
      <div className="mt-8 flex flex-col gap-4">
        <a href={`mailto:${EMAIL}`} className="contact-link">
          <span className="contact-link__icon"><Mail size={18} /></span>
          <span className="contact-link__text">{EMAIL}</span>
        </a>
        <a href={`tel:${PHONE_TEL}`} className="contact-link">
          <span className="contact-link__icon"><Phone size={18} /></span>
          <span className="contact-link__text">{PHONE}</span>
        </a>
      </div>
    </Reveal>
    <Reveal delay={.1}><ContactForm /></Reveal></div></Sec>
}
export function CTA({ onStart }) {
  return <section aria-labelledby="cta-h" className="relative py-32 overflow-hidden text-center">
    <div className="absolute inset-0 grid place-items-center opacity-[.12] pointer-events-none" aria-hidden="true"><div className="scale-[6] animate-[spin_90s_linear_infinite]"><Logo size={60} /></div></div>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet/10 to-transparent" aria-hidden="true" />
    <Reveal className="relative mx-auto max-w-4xl px-5"><h2 id="cta-h" className="text-4xl sm:text-6xl font-bold text-white leading-tight">YOUR IDEA DESERVES A <span className="grad-text">DIGITAL EXPERIENCE.</span></h2>
      <p className="mt-5 text-lg text-slate-400">Let's turn your idea into something people remember.</p>
      <div className="mt-9"><Magnetic><button onClick={() => onStart()} className="btn btn-primary group">Start Your Project <ArrowRight size={16} className="transition group-hover:translate-x-1" /></button></Magnetic></div></Reveal></section>
}
export function Footer() {
  const col = (t, l) => <div><h3 className="text-sm text-white font-semibold mb-4">{t}</h3><ul className="space-y-2 text-sm text-slate-400">{l.map(([a, h]) => <li key={a}><a className="hover:text-white" href={h}>{a}</a></li>)}</ul></div>
  return <footer className="border-t border-white/10 pt-16 pb-8"><div className="mx-auto max-w-7xl px-5">
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
      <div><Logo /><p className="mt-4 text-sm text-slate-400 max-w-xs">Digital experiences. Intelligent solutions. Built for what's next.</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a href="https://www.instagram.com/vexora.nextech?stkn=MWhpeG5hbXZrd2w2Zg==" target="_blank" rel="noopener noreferrer" aria-label="Visit VEXORA on Instagram" title="VEXORA on Instagram" className="glass inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-all duration-200 hover:-translate-y-1 hover:border-cyan/50 hover:text-cyan hover:shadow-[0_0_24px_rgba(110,215,255,.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">
            <Instagram size={19} aria-hidden="true" />
          </a>
          <a href="https://www.linkedin.com/in/vishal-founder-of-vexora-98b73a440/?isSelfProfile=true" target="_blank" rel="noopener noreferrer" aria-label="Visit VEXORA on LinkedIn" title="VEXORA on LinkedIn" className="glass inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition-all duration-200 hover:-translate-y-1 hover:border-cyan/50 hover:text-cyan hover:shadow-[0_0_24px_rgba(110,215,255,.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan">
            <Linkedin size={19} aria-hidden="true" />
          </a>
        </div>
      </div>
      {col('Company', [['About', '#about'], ['Services', '#services'], ['Work', '#work'], ['Process', '#process'], ['Contact', '#contact']])}
      {col('Services', ['Website Development', 'Web Applications', 'AI Solutions', 'UI/UX Design', 'E-Commerce', 'Dashboards'].map(s => [s, '#services']))}
      {col('Contact', [[EMAIL, `mailto:${EMAIL}`], [PHONE, `tel:${PHONE_TEL}`]])}</div>
    <div className="mt-12 pt-6 border-t border-white/5 flex flex-wrap justify-between gap-3 text-xs text-slate-500"><p>© 2026 VEXORA. All rights reserved.</p>
      <p className="flex gap-5"><a href="#" className="hover:text-white">Privacy Policy</a><a href="#" className="hover:text-white">Terms &amp; Conditions</a></p></div></div></footer>
}
