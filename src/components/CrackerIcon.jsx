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
  anardeluxe: (
    <>
      <path d="M9 29 h14 l-3-13 h-8 z" {...common} fill="#15803d" fillOpacity=".35" />
      <path d="M10.5 24 h11 M11.5 19.5 h9" {...common} stroke="#fcd776" />
      <path d="M16 15 c-5-4-8-7-7-12 M16 15 V2.5 M16 15 c5-4 8-7 7-12" {...common} stroke="#fde9b0" />
      <path d="M12 8 l-1.4-1.4 M20 8 l1.4-1.4" {...common} stroke="#f87171" />
    </>
  ),
  colorshower: (
    <>
      <path d="M14 29 h4 v-11 h-4 z" {...common} fill="#7c3aed" fillOpacity=".35" />
      <path d="M16 17 c-6-5-10-3-12 3" {...common} stroke="#f472b6" />
      <path d="M16 17 c6-5 10-3 12 3" {...common} stroke="#4ade80" />
      <path d="M16 17 c-3-6-4-10-2-14" {...common} stroke="#60a5fa" />
      <path d="M16 17 c3-6 4-10 2-14" {...common} stroke="#fde047" />
    </>
  ),
  chakri: (
    <>
      <circle cx="16" cy="18" r="6" {...common} fill="#15803d" fillOpacity=".3" />
      <circle cx="16" cy="18" r="2.4" {...common} />
      <path d="M22 18 c4 0 6-3 6-6 M10 18 c-4 0-6 3-6 6 M16 12 c0-4 3-6 6-6" {...common} stroke="#fde9b0" />
    </>
  ),
  chakrideluxe: (
    <>
      <circle cx="16" cy="17" r="7.5" {...common} fill="#7c3aed" fillOpacity=".3" />
      <circle cx="16" cy="17" r="3" {...common} />
      <path d="M23.5 17 c4 0 6-3 6-6" {...common} stroke="#4ade80" />
      <path d="M8.5 17 c-4 0-6 3-6 6" {...common} stroke="#f87171" />
      <path d="M16 9.5 c0-4 3-6 6-6" {...common} stroke="#fde9b0" />
      <path d="M16 24.5 c0 3-2 5-5 5" {...common} stroke="#60a5fa" />
    </>
  ),
  snake: (
    <>
      <ellipse cx="9" cy="26.5" rx="5" ry="1.8" fill="#57534e" stroke="none" />
      <path d="M9 25 c0-6 6-8 9-5 s-2 7 3 7 s6-6 2-10 s-8-2-7-7" {...common} strokeWidth={2.6} stroke="#a8a29e" />
      <path d="M17 5 c1-1 2-1.5 3-1" {...common} stroke="#78716c" />
    </>
  ),
  asynk: (
    <>
      <path d="M23 8.5 c-2.5-3.5-10-3.8-11.5 0.6 c-1.6 4.6 11 3.6 10 9.6 c-0.8 4.6-8.6 5.4-12.5 1.6" {...common} strokeWidth={2.6} stroke="#ff6a1a" />
      <path d="M8.5 20.6 h5 M8.5 20.6 v-5" {...common} strokeWidth={2.6} stroke="#ff6a1a" />
      <path d="M25 3.5 v2.4 M23.8 4.7 h2.4" {...common} stroke="#fde9b0" />
      <path d="M6 27 h20" {...common} stroke="#fcd776" strokeDasharray="1.2 2.4" />
    </>
  ),
  rocket: (
    <>
      <path d="M16 3 l3 6 v9 h-6 v-9 z" {...common} fill="#dc2626" fillOpacity=".35" />
      <path d="M16 18 v11" {...common} stroke="#a16207" />
      <path d="M13 21 c-2 2-3 4-3 6 M19 21 c2 2 3 4 3 6" {...common} stroke="#fde9b0" />
    </>
  ),
  rocketbundle: (
    <>
      <path d="M16 3 l2 4 v8 h-4 v-8 z" {...common} fill="#dc2626" fillOpacity=".35" />
      <path d="M9 6 l2 4 v7 h-4 v-7 z" {...common} fill="#2563eb" fillOpacity=".35" transform="rotate(-16 9 12)" />
      <path d="M23 6 l2 4 v7 h-4 v-7 z" {...common} fill="#16a34a" fillOpacity=".35" transform="rotate(16 23 12)" />
      <path d="M6 29 h20 v-5 h-20 z" {...common} fill="#a16207" fillOpacity=".35" />
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
  cake: (
    <>
      <path d="M7 29 h18 v-9 h-18 z" {...common} fill="#be185d" fillOpacity=".35" />
      <path d="M10 20 l-3-8 M14 20 l-1-10 M18 20 l1-10 M22 20 l3-8" {...common} stroke="#fde9b0" />
      <circle cx="6.5" cy="10.5" r="1.6" fill="#f0abfc" stroke="none" />
      <circle cx="12.8" cy="8.2" r="1.6" fill="#86efac" stroke="none" />
      <circle cx="19.2" cy="8.2" r="1.6" fill="#93c5fd" stroke="none" />
      <circle cx="25.5" cy="10.5" r="1.6" fill="#fde047" stroke="none" />
    </>
  ),
  bijli: (
    <>
      <circle cx="15" cy="20" r="7.5" {...common} fill="#15803d" fillOpacity=".35" />
      <path d="M8 18.5 c5 3 9 3 14 0 M10.5 25 c3-4 7-9 8.5-12" {...common} stroke="#f5f5f5" strokeWidth={1.2} />
      <path d="M20.5 13.5 c2-3 4-4 6-4.5" {...common} />
      <path d="M27 4 v2.6 M30 7.5 h-2.6 M29 4.8 l-1.7 1.7" {...common} stroke="#fde9b0" />
    </>
  ),
  sutli: (
    <>
      <circle cx="15" cy="20" r="8" {...common} fill="#a16207" fillOpacity=".35" />
      <path d="M8 16 l14 8 M8 22 l13-9 M10 26 l11-12 M12 13 l9 13" {...common} stroke="#fcd776" strokeWidth={1} />
      <path d="M21.5 13 c3-2 4-6 7-7.5" {...common} />
    </>
  ),
  ladi: (
    <>
      <path d="M4 27 C10 23 15 15 28 8" {...common} stroke="#a16207" />
      <path d="M6 24 l3 3 M10 21 l3 3 M14 18 l3 3 M18 15 l3 3 M22 12 l3 3" {...common} strokeWidth={3} stroke="#ef4444" />
      <path d="M27 3.5 v2.5 M29.5 6 h-2.5" {...common} stroke="#fde9b0" />
    </>
  ),
  poppop: (
    <>
      <circle cx="9" cy="23" r="2.6" fill="#f8fafc" stroke="none" />
      <circle cx="17" cy="26" r="2.6" fill="#f8fafc" stroke="none" />
      <circle cx="23" cy="20" r="2.6" fill="#f8fafc" stroke="none" />
      <path d="M17 9 v3.2 M11.5 11.5 l2.2 2.2 M22.5 11.5 l-2.2 2.2 M9 17 h2.8 M25 15.5 h-2.8" {...common} stroke="#fde9b0" />
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
