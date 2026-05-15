import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface ShortQAData {
  qas: { question: string; answer: string }[];
}

export const ShortQAView = ({ data, answerLines }: { data: ShortQAData; answerLines: number }) => {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const toggle = (i: number) =>
    setRevealed((prev) => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground italic">
          Click <strong>Show Answer</strong> to reveal each answer.
        </p>
        <button
          onClick={() => {
            const allRevealed = data.qas.every((_, i) => revealed[i]);
            const next: Record<number, boolean> = {};
            data.qas.forEach((_, i) => { next[i] = !allRevealed; });
            setRevealed(next);
          }}
          className="text-xs text-primary hover:underline"
        >
          {data.qas.every((_, i) => revealed[i]) ? "Hide all" : "Reveal all"}
        </button>
      </div>

      {data.qas.map((qa, i) => (
        <div
          key={i}
          className="glass glass-hover rounded-xl p-4 space-y-2 transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-sm leading-relaxed">
              <span className="text-primary font-bold mr-2">Q{i + 1}.</span>
              {qa.question}
            </p>
            <button
              onClick={() => toggle(i)}
              className="shrink-0 text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5"
            >
              {revealed[i] ? (
                <><ChevronUp className="h-3 w-3" /> Hide</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Show Answer</>
              )}
            </button>
          </div>

          {revealed[i] && (
            <div className="mt-2 pl-5 border-l-2 border-primary/40 animate-fade-up">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {qa.answer}
              </p>
            </div>
          )}

          {/* Write-in lines hint (when hidden) */}
          {!revealed[i] && (
            <div className="pl-5 space-y-1 pt-1">
              {Array.from({ length: answerLines }).map((_, li) => (
                <div
                  key={li}
                  className="border-b border-dashed border-muted-foreground/30 h-5"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
