import { fieldText, pageSize } from '../lib/layout.js'

const PT_TO_MM = 0.3528

/**
 * Draws one cheque page. `unit` = pixels per millimetre, so the same component serves the
 * on-screen press bed and the print sheet (real mm). `editable` shows the field boxes and
 * ignores the printer offset (the offset only applies to paper).
 */
export default function ChequeView({
  entry, profile, settings, unit, editable = false, locked = false, activeField, onFieldDown,
  bg, bgOpacity = 0.6, guides = true,
}) {
  const [W, H] = pageSize(profile)
  return (
    <div
      className={`sheet${editable && guides ? ' guides' : ''}${locked ? ' locked' : ''}`}
      style={{ width: W * unit, height: H * unit }}
    >
      {editable && bg && <img className="bg" src={bg} alt="" style={{ opacity: bgOpacity }} draggable={false} />}
      {Object.entries(profile.fields).map(([key, f]) => {
        if (!f.on) return null
        const x = (Number(f.x) || 0) + (editable ? 0 : Number(profile.nx) || 0)
        const y = (Number(f.y) || 0) + (editable ? 0 : Number(profile.ny) || 0)
        const active = editable && key === activeField
        return (
          <div
            key={key}
            className={`fld${active ? ' act' : ''}`}
            onPointerDown={editable ? (e) => onFieldDown(e, key) : undefined}
            style={{
              left: x * unit,
              top: y * unit,
              width: f.w * unit,
              textAlign: f.align,
              fontFamily: `${f.font}, Arial, sans-serif`,
              fontSize: f.size * PT_TO_MM * unit,
              letterSpacing: (f.ls || 0) * unit,
            }}
          >
            {fieldText(key, entry, profile, settings)}
            {active && guides && <span className="fld-tag">{f.label}</span>}
          </div>
        )
      })}
    </div>
  )
}