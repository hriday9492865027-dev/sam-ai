import { useState } from "react";
import { Check, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface McqData {
  questions: { question: string; options: string[]; answer: string; explanation?: string }[];
}

export const McqView = ({ data }: { data: McqData }) => {
  const [picked, setPicked] = useState<Record<number, string>>({});
  const [showAll, setShowAll] = useState(false);
  const [viewKey, setViewKey] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const letters = ["A", "B", "C", "D"];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-lg font-semibold text-gradient">{data.questions.length} Questions</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewKey((v) => !v)} className={viewKey ? "bg-primary/10 border-primary text-primary" : ""}>
            <Check className="h-3.5 w-3.5 mr-2" /> {viewKey ? "Hide key" : "View key"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? <><EyeOff className="h-3.5 w-3.5 mr-2" /> Hide answers</> : <><Eye className="h-3.5 w-3.5 mr-2" /> Show all answers</>}
          </Button>
        </div>
      </div>

      {data.questions.map((q, i) => (
        <div key={i} className="glass-strong p-5 rounded-xl">
          <div className="flex gap-3">
            <span className="font-display text-2xl text-primary-glow font-semibold">{i + 1}</span>
            <div className="flex-1 space-y-3">
              <p className="font-medium text-foreground/95">{q.question}</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {q.options.map((opt, j) => {
                  const letter = letters[j];
                  const isPicked = picked[i] === letter;
                  const isCorrect = q.answer === letter;
                  const reveal = isPicked || showAll;
                  return (
                    <button
                      key={j}
                      onClick={() => setPicked((p) => ({ ...p, [i]: letter }))}
                      className={`text-left p-3 rounded-lg border text-sm transition-all flex items-start gap-2
                        ${reveal && isCorrect ? "border-success bg-success/20 shadow-[0_0_15px_hsla(var(--success),0.3)]" : ""}
                        ${reveal && isPicked && !isCorrect ? "border-destructive bg-destructive/20 shadow-[0_0_15px_hsla(var(--destructive),0.3)]" : ""}
                        ${!reveal ? "border-border/60 hover:border-primary/60 hover:bg-white/[0.04]" : ""}`}
                    >
                      <span className="font-mono text-xs text-muted-foreground mt-0.5">{letter}.</span>
                      <span className="flex-1">{opt}</span>
                      {reveal && isCorrect && <Check className="h-5 w-5 text-success shrink-0 drop-shadow-[0_0_8px_hsla(var(--success),0.8)]" />}
                      {reveal && isPicked && !isCorrect && <X className="h-5 w-5 text-destructive shrink-0 drop-shadow-[0_0_8px_hsla(var(--destructive),0.8)]" />}
                    </button>
                  );
                })}
              </div>
              {q.explanation && !showAll && (
                <div className="flex justify-start mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowExplanation((prev) => ({ ...prev, [i]: !prev[i] }))}
                    className="text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {showExplanation[i] ? "Hide Explanation" : "Explain"}
                  </Button>
                </div>
              )}
              {(showAll || showExplanation[i]) && q.explanation && (
                <div className="mt-2 p-3.5 bg-background/50 rounded-lg border-l-2 border-l-primary/50 text-sm text-foreground/80 animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className="font-semibold text-primary mb-1 block">Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {(showAll || viewKey) && (
        <div className="mt-6 p-5 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <Check className="h-4 w-4" /> Answer Key
          </h4>
          <div className="flex flex-wrap gap-2.5">
            {data.questions.map((q, i) => (
              <div key={i} className="font-mono text-sm bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-primary/30 text-foreground shadow-sm flex items-center gap-2">
                <span className="text-muted-foreground">{i + 1}</span>
                <span className="text-primary/40">-</span>
                <span className="font-bold text-primary-glow">{q.answer}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
