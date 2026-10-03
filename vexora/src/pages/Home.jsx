import { useState } from 'react'
import { motion } from 'framer-motion'
import CustomCursor from '../components/CustomCursor'
import Logo from '../components/Logo'
import Navbar from '../components/Navbar'
import PaymentModal from '../components/PaymentModal'
import ProjectModal from '../components/ProjectModal'
import RequestModal from '../components/RequestModal'
import Hero from '../sections/Hero'
import { TechStrip, About, Services, Ecosystem, Why, Work, Process, Pricing, Contact, CTA, Footer } from '../sections/Sections'
export default function Home() {
  const [project, setProject] = useState(null), [req, setReq] = useState({ open: false, preset: '' }), [payPlan, setPayPlan] = useState(null)
  const start = preset => setReq({ open: true, preset: typeof preset === 'string' ? preset : '' })
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .6 }}>
    <CustomCursor />
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:top-2 focus:left-2 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded">Skip to content</a>
    <Navbar onStart={start} />
    <main id="main"><Hero onStart={start} /><TechStrip /><About /><Services /><Ecosystem /><Why /><Work onOpen={setProject} /><Process /><Pricing onStart={start} onPayPlan={setPayPlan} /><Contact /><CTA onStart={start} /></main>
    <Footer />
    <ProjectModal project={project} onClose={() => setProject(null)} onStart={start} />
    <PaymentModal plan={payPlan} onClose={() => setPayPlan(null)} />
    <RequestModal open={req.open} preset={req.preset} onClose={() => setReq({ open: false, preset: '' })} />
  </motion.div>
}
