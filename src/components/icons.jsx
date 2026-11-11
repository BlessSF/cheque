/** Small 16px stroke icons. One weight, no fills, so they sit quietly next to text. */
const base = {
  width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true,
}
const I = (d) => function Icon(props) { return <svg {...base} {...props}>{d}</svg> }

export const IconLock = I(<><rect x="3" y="7" width="10" height="6.5" rx="1.2" /><path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" /></>)
export const IconUnlock = I(<><rect x="3" y="7" width="10" height="6.5" rx="1.2" /><path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.4-1" /></>)
export const IconPlus = I(<path d="M8 3v10M3 8h10" />)
export const IconCopy = I(<><rect x="5.5" y="5.5" width="8" height="8" rx="1.2" /><path d="M10.5 5.5V4a1.2 1.2 0 0 0-1.2-1.2H4A1.2 1.2 0 0 0 2.8 4v5.3A1.2 1.2 0 0 0 4 10.5h1.5" /></>)
export const IconPrint = I(<><path d="M4.5 6V2.8h7V6" /><rect x="2.5" y="6" width="11" height="5" rx="1.2" /><path d="M4.5 9.5h7v4h-7z" /></>)
export const IconTrash = I(<><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" /></>)
export const IconImport = I(<><path d="M8 2.5v7M5.2 7 8 9.8 10.8 7" /><path d="M3 11v1.8c0 .4.3.7.7.7h8.6c.4 0 .7-.3.7-.7V11" /></>)
export const IconChevronDown = I(<path d="M4 6.2 8 10l4-3.8" />)
export const IconChevronLeft = I(<path d="M9.8 3.5 5.3 8l4.5 4.5" />)
export const IconChevronRight = I(<path d="M6.2 3.5 10.7 8l-4.5 4.5" />)
export const IconCheck = I(<path d="m3.5 8.5 3 3 6-7" />)
export const IconWarn = I(<><path d="M8 2.5 14 13H2L8 2.5Z" /><path d="M8 6.5v3M8 11.3v.1" /></>)
export const IconClose = I(<path d="m4 4 8 8M12 4l-8 8" />)
export const IconTarget = I(<><circle cx="8" cy="8" r="4.5" /><path d="M8 1.5v3M8 11.5v3M1.5 8h3M11.5 8h3" /></>)

/** Brand mark: a cheque outline with a signature line and an amount box. */
export function Mark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="1.5" y="6" width="25" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 12h10M5.5 16.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="17.5" y="10.5" width="5" height="4" rx=".8" fill="var(--guide)" />
    </svg>
  )
}