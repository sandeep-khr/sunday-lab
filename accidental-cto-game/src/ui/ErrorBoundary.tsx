import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center p-6">
          <div className="w-[min(560px,94vw)] rounded-xl border border-red-alert/50 bg-panel p-6 text-center glow-red">
            <span className="font-mono text-[10px] tracking-[0.4em] text-rose-400">SYSTEM FAULT</span>
            <p className="mt-3 font-mono text-[12px] leading-relaxed text-slate-300">{this.state.error.message}</p>
            <button
              onClick={() => {
                this.setState({ error: null })
                location.reload()
              }}
              className="mt-5 rounded-lg border border-cyan-glow/60 bg-cyan-glow/10 px-8 py-2 font-mono text-xs font-bold tracking-widest text-cyan-200 hover:bg-cyan-glow/20"
            >
              REBOOT
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
