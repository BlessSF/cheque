import { useRef, useState } from 'react'
import { IconImport } from './icons.jsx'

/** Options > Move to another computer. */
export default function BackupGroup({ onExport, onImport, onPublish }) {
  const [withCheques, setWithCheques] = useState(false)
  const file = useRef(null)
  return (
    <>
    <section className="group">
      <h3>Move to another computer</h3>
      <p className="help">Save your bank layouts and settings to a file, then open that file on the other computer. No account or database needed.</p>
      <label className="check-row">
        <input type="checkbox" checked={withCheques} onChange={(e) => setWithCheques(e.target.checked)} />
        <span>Include the cheque list</span>
      </label>
      <div className="btn-row">
        <button className="btn primary" onClick={() => onExport(withCheques)}>Save backup file</button>
        <button className="btn" onClick={() => file.current?.click()}><IconImport /> Open backup file</button>
      </div>
      <input ref={file} type="file" accept=".json,application/json" hidden
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) f.text().then(onImport) }} />
    </section>
    <section className="group">
      <h3>Shared layout</h3>
      <p className="help">Use one layout on every computer. This saves the layout you see now, for all banks, as <b>default-layout.json</b>. Put that file in your project's <b>src</b> folder and push it. After the site rebuilds, every computer that opens the link uses this layout.</p>
      <button className="btn primary" onClick={onPublish}>Save layout for all computers</button>
    </section>
    </>
  )
}