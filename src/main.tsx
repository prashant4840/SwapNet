import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from '@/App'
import '@/index.css'
import { initErrorTracking } from '@/services/errorTracking'
import { initAnalytics } from '@/services/analytics'

// Initialize production tools
initErrorTracking()
initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        className:
          'border border-white/20 bg-slate-900 text-sm text-slate-50 shadow-soft dark:border-slate-700 dark:bg-slate-800',
      }}
    />
  </StrictMode>,
)
