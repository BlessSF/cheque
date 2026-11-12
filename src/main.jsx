import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Gate from './components/Gate.jsx'
import './styles.css'
import { applySharedAtBoot } from './lib/shared.js'

applySharedAtBoot() // before anything reads saved data

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Gate />
  </StrictMode>,
)