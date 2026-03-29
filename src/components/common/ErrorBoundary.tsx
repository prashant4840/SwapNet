import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
          <div className="glass-panel w-full max-w-md p-6 text-center">
            <div className="mb-4 text-6xl">😵</div>
            <h1 className="mb-2 text-2xl font-bold text-slate-950 dark:text-white">
              Something went wrong
            </h1>
            <p className="mb-6 text-slate-600 dark:text-slate-300">
              {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
            </p>
            <button
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              onClick={() => window.history.back()}
              type="button"
            >
              Go back
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
