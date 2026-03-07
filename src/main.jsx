import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import KANDZ from './KANDZ.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KANDZ />
  </StrictMode>,
)
