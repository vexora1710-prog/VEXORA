import * as L from 'lucide-react'
export default function Icon({ name, ...p }) { const C = L[name] || L.Circle; return <C aria-hidden="true" {...p} /> }
