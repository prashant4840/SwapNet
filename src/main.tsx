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
        className: 'text-sm font-medium shadow-lg backdrop-blur-md border px-4 py-3 rounded-2xl transition-all duration-300',
        style: {
          background: 'var(--toast-bg)',
          color: 'var(--toast-color)',
          borderColor: 'var(--toast-border)',
        },
        success: {
          style: {
            background: 'var(--toast-success-bg)',
            color: 'var(--toast-success-color)',
            borderColor: 'var(--toast-success-border)',
          },
          iconTheme: {
            primary: '#10b981',
            secondary: 'var(--toast-success-bg)',
          },
        },
        error: {
          style: {
            background: 'var(--toast-error-bg)',
            color: 'var(--toast-error-color)',
            borderColor: 'var(--toast-error-border)',
          },
          iconTheme: {
            primary: '#ef4444',
            secondary: 'var(--toast-error-bg)',
          },
        },
        loading: {
          style: {
            background: 'var(--toast-loading-bg)',
            color: 'var(--toast-loading-color)',
            borderColor: 'var(--toast-loading-border)',
          },
        },
      }}
    />
  </StrictMode>,
)
