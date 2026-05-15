import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Trophy, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import type { McqData } from "./outputs/McqView";

interface Props {
  data: McqData;
  onClose: () => void;
}

const LETTERS = ["A", "B", "C", "D"];

export const QuizMode = ({ data, onClose }: Props) => {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const total = data.questions.length;
  const q = data.questions[current];
  const correctIndex = LETTERS.indexOf(q.answer);
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 60;

  useEffect(() => {
    if (finished && passed) {
      confetti({
        particleCount: 160,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#a855f7", "#38bdf8", "#f472b6", "#facc15"],
      });
    }
  }, [finished, passed]);

  const handlePick = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === correctIndex) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setAnswers((prev) => [...prev, selected]);
    if (current + 1 >= total) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
    setAnswers([]);
  };

  if (finished) {
    return (
      <div className="glass p-6 md:p-10 rounded-2xl space-y-6 text-center animate-fade-up">
        <div className="flex flex-col items-center gap-3">
          <Trophy className={`h-14 w-14 ${passed ? "text-yellow-400" : "text-muted-foreground"}`} />
          <h2 className="font-display text-2xl font-bold">
            {passed ? "🎉 You Passed!" : "Keep Practicing!"}
          </h2>
          <p className="text-muted-foreground text-sm">
            You scored <span className="text-foreground font-bold text-lg">{score}/{total}</span> ({pct}%)
          </p>
        </div>

        {/* Score ring */}
        <div className="flex justify-center">
          <div className="relative h-28 w-28">
            <svg className="absolute inset-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke={passed ? "#a855f7" : "#f472b6"}
                strokeWidth="10"
                strokeDasharray={`${2.64 * pct} 264`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{pct}%</span>
            </div>
          </div>
        </div>

        {/* Per-question review */}
        <div className="space-y-2 text-left max-h-52 overflow-auto scrollbar-thin">
          {data.questions.map((qq, i) => {
            const ci = LETTERS.indexOf(qq.answer);
            const userIdx = answers[i] ?? -1;
            const correct = userIdx === ci;
            return (
              <div key={i} className={`flex items-start gap-2 p-3 rounded-xl text-sm ${correct ? "bg-green-500/10" : "bg-red-500/10"}`}>
                {correct
                  ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                  : <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />}
                <span className="text-foreground/80">{qq.question}</span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={handleRestart} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" /> Retry Quiz
          </Button>
          <Button onClick={onClose}>Back to Questions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass p-6 md:p-8 rounded-2xl space-y-6 animate-fade-up">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Question {current + 1} of {total}</span>
          <span>Score: {score}</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${((current) / total) * 100}%`,
              background: "linear-gradient(90deg, hsl(280 90% 65%), hsl(200 100% 65%))",
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="relative z-10">
        <p className="font-semibold text-base md:text-lg leading-relaxed">
          <span className="text-primary font-bold mr-2">Q{current + 1}.</span>
          {q.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map((opt, idx) => {
          let cls = "glass glass-hover cursor-pointer border-2 ";
          if (!revealed) {
            cls += selected === idx
              ? "border-primary/80 bg-primary/10"
              : "border-transparent hover:border-primary/40";
          } else {
            if (idx === correctIndex) {
              cls += "border-green-400/80 bg-green-500/15 cursor-default";
            } else if (idx === selected && idx !== correctIndex) {
              cls += "border-red-400/80 bg-red-500/15 cursor-default";
            } else {
              cls += "border-transparent opacity-50 cursor-default";
            }
          }
          return (
            <button
              key={idx}
              onClick={() => handlePick(idx)}
              className={`${cls} w-full text-left p-4 rounded-xl flex items-center gap-3 transition-all duration-200`}
            >
              <span className="shrink-0 w-7 h-7 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                {LETTERS[idx]}
              </span>
              <span className="text-sm leading-relaxed relative z-10">{opt}</span>
              {revealed && idx === correctIndex && (
                <CheckCircle2 className="ml-auto h-5 w-5 text-green-400 shrink-0" />
              )}
              {revealed && idx === selected && idx !== correctIndex && (
                <XCircle className="ml-auto h-5 w-5 text-red-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback + Next */}
      {revealed && (
        <div className="flex items-center justify-between animate-fade-up">
          <p className={`text-sm font-semibold ${selected === correctIndex ? "text-green-400" : "text-red-400"}`}>
            {selected === correctIndex ? "✓ Correct!" : `✗ Correct answer: ${q.answer}. ${q.options[correctIndex]}`}
          </p>
          <Button onClick={handleNext} size="sm">
            {current + 1 >= total ? "See Results" : "Next"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Close */}
      <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        ← Exit quiz
      </button>
    </div>
  );
};
