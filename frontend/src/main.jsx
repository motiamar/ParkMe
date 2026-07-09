import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'           // global reset and base styles
import App from './controllers/App.jsx'  // root controller
import AdminAuditLog from './pages/AdminAuditLog.jsx'
import { TextSizeProvider } from './utils/TextSizeContext.jsx'

const isAdminAudit = window.location.pathname === '/admin/audit';

// Mount the React app into the #root div defined in index.html.
// StrictMode enables extra warnings during development (no effect in production).
// TextSizeProvider applies the user's saved text-size preference on startup
// and makes it available to all components via useTextSize().
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TextSizeProvider>
      {isAdminAudit ? <AdminAuditLog /> : <App />}
    </TextSizeProvider>
  </StrictMode>,
)
