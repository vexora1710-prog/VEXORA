import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const cursorRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    if (!cursor || !finePointer.matches) return

    document.body.classList.add('custom-cursor-active')

    const move = event => {
      cursor.style.left = `${event.clientX}px`
      cursor.style.top = `${event.clientY}px`
      cursor.classList.add('is-visible')
    }
    const hover = event => {
      cursor.classList.toggle('is-hovering', Boolean(event.target.closest('a, button, [role="button"], input, textarea, select, label')))
    }
    const press = () => cursor.classList.add('is-pressed')
    const release = () => cursor.classList.remove('is-pressed')
    const leave = () => cursor.classList.remove('is-visible')

    window.addEventListener('pointermove', move)
    document.addEventListener('pointerover', hover)
    document.addEventListener('pointerdown', press)
    document.addEventListener('pointerup', release)
    document.addEventListener('pointerleave', leave)

    return () => {
      document.body.classList.remove('custom-cursor-active')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', hover)
      document.removeEventListener('pointerdown', press)
      document.removeEventListener('pointerup', release)
      document.removeEventListener('pointerleave', leave)
    }
  }, [])

  return <span ref={cursorRef} className="custom-cursor" aria-hidden="true" />
}