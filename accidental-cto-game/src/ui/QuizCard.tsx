import { motion } from 'framer-motion'
import { useGame } from '../engine/store'
import { sfx } from '../engine/sound'

export default function QuizCard() {
  const chapter = useGame((s) => s.chapter())
  const quiz = useGame((s) => s.lastQuiz)
  const feedback = useGame((s) => s.quizFeedback)
  const answerQuiz = useGame((s) => s.answerQuiz)
  const proceed = useGame((s) => s.proceedFromQuiz)
  if (!quiz) return null

  const pick = (i: number) => {
    if (feedback) return
    if (i === quiz.answer) sfx.correct()
    else sfx.wrong()
    answerQuiz(i)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-6 py-6">
      <div className="mb-1 font-mono text-[10px] tracking-[0.3em] text-amber-400">KNOWLEDGE CHECK</div>
      <h3 className="mb-5 text-lg leading-snug font-bold text-slate-100">{chapter.title}</h3>
      <p className="mb-4 text-[15px] leading-relaxed text-slate-200">{quiz.q}</p>
      <div className="flex flex-col gap-2.5">
        {quiz.options.map((opt, i) => {
          const answered = !!feedback
          const isAnswer = i === quiz.answer
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => pick(i)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                answered
                  ? isAnswer
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                    : feedback?.correct
                      ? 'border-edge text-slate-500'
                      : i === quiz.answer || true
                        ? 'border-edge text-slate-500'
                        : ''
                  : 'border-edge bg-panel-2/70 text-slate-200 hover:border-cyan-glow/60 hover:bg-panel-2'
              }`}
            >
              <span className="mr-2 font-mono text-xs text-slate-500">{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          )
        })}
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
          <div className={`rounded-lg border p-4 ${feedback.correct ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-amber-400/50 bg-amber-400/10'}`}>
            <div className="font-mono text-[11px] tracking-widest" style={{ color: feedback.correct ? '#34d399' : '#fbbf24' }}>
              {feedback.correct ? 'CORRECT — +2 TEAM MORALE' : 'NOT QUITE — READ ON'}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{feedback.explain}</p>
          </div>
          <button
            onClick={proceed}
            className="mt-5 w-full rounded-lg border border-cyan-glow/50 bg-cyan-glow/10 py-3 font-mono text-sm font-bold tracking-widest text-cyan-200 transition-all hover:bg-cyan-glow/20 focus:outline-none"
          >
            CLOSE MONTH →
          </button>
        </motion.div>
      )}
    </div>
  )
}
