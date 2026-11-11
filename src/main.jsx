import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Gate from './components/Gate.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Gate />
  </StrictMode>,
)