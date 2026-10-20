import type { ReactNode } from 'react'

export function WrPanel({ title, right, children, className = '' }: { title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-edge bg-panel/90 backdrop-blur-sm ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between border-b border-edge px-4 py-2">
          {title && <h3 className="font-mono text-[10px] font-bold tracking-[0.3em] text-slate-400">{title}</h3>}
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function WrChip({ label, value, tone = '#67e8f9' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-edge bg-panel px-3 py-1.5">
      <div className="font-mono text-[8px] tracking-[0.2em] text-slate-500">{label}</div>
      <div className="font-mono text-sm font-bold" style={{ color: tone }}>
        {value}
      </div>
    </div>
  )
}

export function WrMeter({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const t = tone ?? (value > 0.92 ? '#fb4d63' : value > 0.75 ? '#fbbf24' : '#34d399')
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 shrink-0 truncate font-mono text-[9px] tracking-widest text-slate-500">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-edge">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, value * 100)}%`, background: t }} />
      </div>
      <span className="w-12 text-right font-mono text-[9px]" style={{ color: t }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}

export function WrButton({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'warn'
  disabled?: boolean
  className?: string
}) {
  const styles: Record<string, string> = {
    primary: 'border-cyan-glow/60 bg-cyan-glow/15 text-cyan-100 hover:bg-cyan-glow/25 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]',
    ghost: 'border-edge bg-panel-2/70 text-slate-300 hover:border-cyan-glow/50 hover:text-cyan-200',
    danger: 'border-red-alert/50 bg-red-alert/10 text-rose-200 hover:bg-red-alert/20',
    warn: 'border-amber-400/50 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20',
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-4 py-2 font-mono text-xs font-bold tracking-widest transition-all focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

export function WrLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 font-mono text-[9px] tracking-[0.3em] text-slate-500">{children}</div>
}
