// Project-original UI icons (24x24, 2px round stroke). Written for this app so
// no third-party icon licence applies.
function Svg({ className = 'h-4 w-4', children, ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const FlameIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.8.3 1.5 1 2.4 1.9 2.8C11 8.6 11.3 5.6 12 3z" />
  </Svg>
)

export const SpinnerIcon = ({ className = 'h-4 w-4', ...p }) => (
  <Svg className={`${className} animate-spin`} {...p}>
    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
  </Svg>
)

export const ShieldIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 3v6c0 4.6-3.4 8.2-8 9-4.6-.8-8-4.4-8-9V6l8-3z" />
    <path d="M12 8v4.5" />
    <path d="M12 16h.01" />
  </Svg>
)

export const ReplayIcon = (p) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </Svg>
)

export const TrashIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M10 11v6M14 11v6" />
  </Svg>
)

export const SoundOnIcon = (p) => (
  <Svg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </Svg>
)

export const SoundOffIcon = (p) => (
  <Svg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M17 9l5 6M22 9l-5 6" />
  </Svg>
)

export const SparkleIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7L19 16z" />
  </Svg>
)

export const MusicIcon = (p) => (
  <Svg {...p}>
    <path d="M9 18V5l11-2v13" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="17.5" cy="16" r="2.5" />
  </Svg>
)

export const MusicOffIcon = (p) => (
  <Svg {...p}>
    <path d="M9 18V9M9 5l11-2v9" />
    <circle cx="6.5" cy="18" r="2.5" />
    <path d="M3 3l18 18" />
  </Svg>
)

export const PinIcon = (p) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
)

export const BoltIcon = (p) => (
  <Svg {...p}>
    <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
  </Svg>
)
