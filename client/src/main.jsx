import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './satoshi.css'
import './index.css'
import './platform.css'
import './design-overrides.css'
import App from './PlatformApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
