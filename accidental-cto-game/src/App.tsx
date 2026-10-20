import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGame } from './engine/store'
import { initAudioOnFirstGesture, sfx } from './engine/sound'
import HUD from './ui/HUD'
import Diagram from './ui/Diagram'
import ConceptCard from './ui/ConceptCard'
import LiveChart from './ui/LiveChart'
import ToastFeed from './ui/ToastFeed'
import UnlockBanner from './ui/UnlockBanner'
import DecisionCard from './ui/DecisionCard'
import ResultPanel from './ui/ResultPanel'
import QuizCard from './ui/QuizCard'
import MonthReport from './ui/MonthReport'
import LevelIntro from './ui/LevelIntro'
import JourneyStrip from './ui/JourneyStrip'
import GameOverScreen from './ui/GameOverScreen'
import EndingsScreen from './ui/EndingsScreen'
import TitleScreen from './ui/TitleScreen'
import CodexPanel from './ui/CodexPanel'
import LabScreen from './ui/lab/LabScreen'
import ArenaScreen from './ui/arena/ArenaScreen'
import IncidentScreen from './ui/incident/IncidentScreen'
import MasteryScreen from './ui/mastery/MasteryScreen'

export default function App() {
  const phase = useGame((s) => s.phase)
  const lastReport = useGame((s) => s.lastReport)
  const [codexOpen, setCodexOpen] = useState(false)
  const [labOpen, setLabOpen] = useState(false)
  const [arenaOpen, setArenaOpen] = useState(false)
  const [incidentOpen, setIncidentOpen] = useState(false)
  const [masteryOpen, setMasteryOpen] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    initAudioOnFirstGesture()
    const openLab = () => setLabOpen(true)
    const openArena = () => setArenaOpen(true)
    const openIncident = () => setIncidentOpen(true)
    const openMastery = () => setMasteryOpen(true)
    document.addEventListener('open-lab', openLab)
    document.addEventListener('open-arena', openArena)
    document.addEventListener('open-incident', openIncident)
    document.addEventListener('open-mastery', openMastery)
    return () => {
      document.removeEventListener('open-lab', openLab)
      document.removeEventListener('open-arena', openArena)
      document.removeEventListener('open-incident', openIncident)
      document.removeEventListener('open-mastery', openMastery)
    }
  }, [])

  const incidentCount = lastReport?.incidents.filter((i) => i.id !== 'elastic-scale').length ?? 0
  const alert = (phase === 'report' && incidentCount > 0) || phase === 'gameover'

  useEffect(() => {
    if (alert) {
      sfx.alarm()
      setShake(true)
      const t = setTimeout(() => setShake(false), 700)
      return () => clearTimeout(t)
    }
  }, [alert])

  if (labOpen) {
    return (
      <div className="h-full overflow-hidden grid-bg">
        <LabScreen onExit={() => setLabOpen(false)} />
      </div>
    )
  }

  if (arenaOpen) {
    return (
      <div className="h-full overflow-hidden grid-bg">
        <ArenaScreen onExit={() => setArenaOpen(false)} />
      </div>
    )
  }

  if (incidentOpen) {
    return (
      <div className="h-full overflow-hidden grid-bg">
        <IncidentScreen onExit={() => setIncidentOpen(false)} />
      </div>
    )
  }

  if (masteryOpen) {
    return (
      <div className="h-full overflow-hidden grid-bg">
        <MasteryScreen onExit={() => setMasteryOpen(false)} />
      </div>
    )
  }

  const inGame = phase !== 'title' && phase !== 'gameover' && phase !== 'ending'
  const sidebarPhase = phase === 'scene' || phase === 'result' || phase === 'quiz' || phase === 'report'

  return (
    <div className={`relative flex h-full flex-col overflow-hidden grid-bg ${alert ? 'alert-mode' : ''}`}>
      {inGame && <HUD onOpenCodex={() => setCodexOpen(true)} />}

      <main className={`relative flex min-h-0 flex-1 ${shake ? 'shake-once' : ''}`}>
        {inGame && (
          <div className="relative min-w-0 flex-1">
            <div className={`absolute inset-0 p-2 transition-opacity duration-300 ${sidebarPhase ? 'opacity-90' : 'opacity-100'}`}>
              <Diagram alert={alert} />
            </div>
            <LiveChart alert={alert} />
            <ToastFeed active={sidebarPhase} />
            <ConceptCard />
          </div>
        )}

        {inGame && (
          <aside className="relative z-10 flex h-full w-[min(450px,92vw)] shrink-0 flex-col border-l border-edge bg-panel/90 backdrop-blur-sm">
            <JourneyStrip />
            <div className="relative min-h-0 flex-1">
              <AnimatePresence mode="wait">
                {(phase === 'scene' || phase === 'result') && (
                  <motion.div key={phase} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
                    {phase === 'scene' ? <DecisionCard /> : <ResultPanel />}
                  </motion.div>
                )}
                {phase === 'quiz' && (
                  <motion.div key="quiz" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col">
                    <QuizCard />
                  </motion.div>
                )}
                {phase === 'report' && (
                  <motion.div key="report" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="absolute inset-0 flex flex-col">
                    <MonthReport />
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 'intro' && (
                <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 overflow-y-auto">
                  <LevelIntro />
                </motion.div>
              )}
            </div>
          </aside>
        )}

        {!inGame && (
          <AnimatePresence mode="wait">
            {phase === 'title' && (
              <motion.div key="title" className="flex min-h-full w-full justify-center" exit={{ opacity: 0 }}>
                <TitleScreen />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <UnlockBanner />
      {phase === 'gameover' && <GameOverScreen />}
      {phase === 'ending' && <EndingsScreen />}
      {codexOpen && <CodexPanel onClose={() => setCodexOpen(false)} />}
    </div>
  )
}
