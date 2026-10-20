import { useEffect, useRef } from 'react'
import { loadOf, p95ms } from '../engine/state'
import { useGame } from '../engine/store'

const N = 140

export default function LiveChart({ alert }: { alert: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const rps = useRef<number[]>([])
  const lat = useRef<number[]>([])
  const phase = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let raf = 0
    let last = 0

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw)
      if (now - last < 80) return
      last = now
      phase.current += 0.12

      const s = useGame.getState().game
      const targetRps = loadOf(s) * 1000
      const targetLat = p95ms(s)
      const spike = alert ? 1 + Math.random() * 0.9 : 1
      const wobble = (Math.sin(phase.current) + Math.sin(phase.current * 2.7) * 0.5) * 0.06 + (Math.random() - 0.5) * 0.08

      rps.current.push(targetRps * spike * (1 + wobble))
      lat.current.push(targetLat * spike * (1 + wobble * 1.4))
      if (rps.current.length > N) rps.current.shift()
      if (lat.current.length > N) lat.current.shift()

      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      ctx.strokeStyle = 'rgba(30,45,71,0.5)'
      ctx.lineWidth = 1
      for (let i = 1; i < 4; i++) {
        ctx.beginPath()
        ctx.moveTo(0, (h / 4) * i)
        ctx.lineTo(w, (h / 4) * i)
        ctx.stroke()
      }

      const drawSeries = (data: number[], color: string, fill: string) => {
        if (data.length < 2) return
        const max = Math.max(...data) * 1.15 || 1
        ctx.beginPath()
        data.forEach((v, i) => {
          const x = (i / (N - 1)) * w
          const y = h - (v / max) * h * 0.92
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.strokeStyle = color
        ctx.lineWidth = 1.6
        ctx.shadowColor = color
        ctx.shadowBlur = 6
        ctx.stroke()
        ctx.shadowBlur = 0
        ctx.lineTo(w, h)
        ctx.lineTo(0, h)
        ctx.closePath()
        const grad = ctx.createLinearGradient(0, 0, 0, h)
        grad.addColorStop(0, fill)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.fill()
      }

      drawSeries(rps.current, alert ? '#fb4d63' : '#22d3ee', 'rgba(34,211,238,0.18)')
      drawSeries(lat.current, '#fbbf24', 'rgba(251,191,36,0.10)')

      const lastRps = rps.current[rps.current.length - 1] ?? 0
      const lastLat = lat.current[lat.current.length - 1] ?? 0
      ctx.font = '10px "JetBrains Mono", monospace'
      ctx.fillStyle = alert ? '#fb4d63' : '#67e8f9'
      ctx.fillText(`RPS ${Math.round(lastRps).toLocaleString()}`, 6, 12)
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(`P95 ${Math.round(lastLat)}ms`, 6, 25)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [alert])

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 h-[92px] w-[min(300px,45%)] overflow-hidden rounded-lg border border-edge bg-panel/75 backdrop-blur-sm">
      <canvas ref={ref} className="h-full w-full" />
      <span className="absolute right-2 top-1.5 font-mono text-[8px] tracking-[0.2em] text-slate-500">LIVE TRAFFIC</span>
    </div>
  )
}
