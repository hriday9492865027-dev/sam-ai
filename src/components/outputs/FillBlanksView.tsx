import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export interface FillBlanksData {
  questions: { sentence: string; answer: string; explanation?: string }[];
}

export const FillBlanksView = ({ data }: { data: FillBlanksData }) => {
  const [reveal, setReveal] = useState<Record<number, boolean>>({});
  const [revealAll, setRevealAll] = useState(false);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-display text-lg font-semibold text-gradient">Fill in the Blanks</h3>
        <Button variant="ghost" size="sm" onClick={() => setRevealAll((v) => !v)}>
          {revealAll ? <><EyeOff className="h-3.5 w-3.5 mr-2" /> Hide all</> : <><Eye className="h-3.5 w-3.5 mr-2" /> Reveal all</>}
        </Button>
      </div>
      {data.questions.map((q, i) => {
        const show = revealAll || reveal[i];
        const parts = q.sentence.split(/_{2,}/);
        return (
          <div key={i} className="glass-strong p-4 rounded-xl flex flex-col">
            <div className="flex items-start gap-3">
              <span className="font-display text-xl text-primary-glow font-semibold w-7 shrink-0">{i + 1}</span>
              <div className="flex-1 space-y-2 mt-0.5">
              <p className="leading-relaxed text-foreground/90">
                {parts.map((p, idx) => (
                  <span key={idx}>
                    {p}
                    {idx < parts.length - 1 && (
                      <span className={`inline-block min-w-[80px] mx-1 px-2 py-0.5 rounded-md border-b-2 ${show ? "border-success bg-success/10 text-success font-medium" : "border-primary/60 bg-primary/10"}`}>
                        {show ? q.answer : "______"}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReveal((r) => ({ ...r, [i]: !r[i] }))}
                className="text-xs"
              >
                {show ? "Hide" : "Show"}
              </Button>
            </div>
          </div>
          {q.explanation && (
            <div className="mt-2 ml-10">
              {!revealAll && (
                <div className="flex justify-start mb-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowExplanation((prev) => ({ ...prev, [i]: !prev[i] }))}
                    className="text-primary hover:bg-primary/10 hover:text-primary text-xs"
                  >
                    {showExplanation[i] ? "Hide Explanation" : "Explain"}
                  </Button>
                </div>
              )}
              {(revealAll || showExplanation[i]) && (
                <div className="p-3.5 bg-background/50 rounded-lg border-l-2 border-l-primary/50 text-sm text-foreground/80 animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className="font-semibold text-primary mb-1 block">Explanation:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          )}
        </div>
        );
      })}
    </div>
  );
};
