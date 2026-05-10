import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'           // global reset and base styles
import App from './controllers/App.jsx'  // root controller

// Mount the React app into the #root div defined in index.html.
// StrictMode enables extra warnings during development (no effect in production).
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
