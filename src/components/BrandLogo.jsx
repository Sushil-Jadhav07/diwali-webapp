const LOGO_URL = `${import.meta.env.BASE_URL}assets/logomain.png`

// The ASYNK wordmark is black + orange on a transparent background, so it sits
// on a warm light plate to stay legible on the dark night UI.
export default function BrandLogo({ size = 'md', className = '' }) {
  const h = size === 'lg' ? 'h-7' : 'h-[17px] md:h-[22px]'
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-xl bg-[#fff8ee] px-2.5 py-1.5 shadow-[0_4px_14px_-6px_rgb(0_0_0/0.7)] ring-1 ring-gold-400/50 ${className}`}
    >
      <img
        src={LOGO_URL}
        alt="ASYNK"
        width={1032}
        height={319}
        className={`${h} w-auto select-none`}
        draggable={false}
        decoding="async"
      />
    </span>
  )
}
