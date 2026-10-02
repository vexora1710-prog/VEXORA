import { useEffect, useState } from 'react'
export default function useCanUse3D() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl2') || c.getContext('webgl')
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
      setOk(!!gl && !reduce)
    } catch { setOk(false) }
  }, [])
  return ok
}
