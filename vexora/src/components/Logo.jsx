export default function Logo({ size = 28 }) {
  return (<span className="inline-flex items-center gap-2 font-display font-bold tracking-[.2em] text-white">
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8b5cf6"/><stop offset="1" stopColor="#22d3ee"/></linearGradient></defs><path d="M10 12h12l10 28 10-28h12L38 54H26z" fill="url(#lg)"/></svg>VEXORA</span>)
}
