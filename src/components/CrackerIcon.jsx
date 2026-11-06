// Hand-drawn SVG icons for each cracker (consistent 1.75 stroke, gold palette).
const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const ICONS = {
  phuljhadi: (
    <>
      <path d="M8 26 L20 10" {...common} />
      <path d="M20 10 l-1.5 4 M20 10 l3.8-1.6 M20 10 l2.2 3.5 M20 10 l-3.6-1.6 M20 10 l.6-4.2" {...common} stroke="#fde9b0" />
      <circle cx="20" cy="10" r="1.6" fill="#fff4cc" stroke="none" />
      <path d="M6.5 27.5 l3-3" {...common} strokeWidth={3} stroke="#b45309" />
    </>
  ),
  anar: (
    <>
      <path d="M9 27 h14 l-3-11 h-8 z" {...common} fill="#c2410c" fillOpacity=".35" />
      <path d="M11 22 h10" {...common} stroke="#fcd776" />
      <path d="M16 15 c-4-5-6-8-5-12 M16 15 c0-5 0-8 0-12 M16 15 c4-5 6-8 5-12" {...common} stroke="#fde9b0" />
    </>
  ),
  chakri: (
    <>
      <circle cx="16" cy="18" r="6" {...common} fill="#15803d" fillOpacity=".3" />
      <circle cx="16" cy="18" r="2.4" {...common} />
      <path d="M22 18 c4 0 6-3 6-6 M10 18 c-4 0-6 3-6 6 M16 12 c0-4 3-6 6-6" {...common} stroke="#fde9b0" />
    </>
  ),
  rocket: (
    <>
      <path d="M16 3 l3 6 v9 h-6 v-9 z" {...common} fill="#dc2626" fillOpacity=".35" />
      <path d="M16 18 v11" {...common} stroke="#a16207" />
      <path d="M13 21 c-2 2-3 4-3 6 M19 21 c2 2 3 4 3 6" {...common} stroke="#fde9b0" />
    </>
  ),
  skyshot: (
    <>
      <path d="M12 29 h8 v-7 h-8 z" {...common} fill="#7c3aed" fillOpacity=".35" />
      <path d="M16 22 v-6" {...common} strokeDasharray="1.5 2" />
      <circle cx="16" cy="10" r="2" fill="#fde9b0" stroke="none" />
      <path
        d="M16 3.5 v2.5 M16 14 v2 M9.5 10 h2.5 M20 10 h2.5 M11.4 5.4 l1.8 1.8 M18.8 12.8 l1.8 1.8 M20.6 5.4 l-1.8 1.8 M13.2 12.8 l-1.8 1.8"
        {...common}
        stroke="#f0abfc"
      />
    </>
  ),
}

export default function CrackerIcon({ id, className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      {ICONS[id]}
    </svg>
  )
}
