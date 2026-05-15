import { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, RotateCcw, Eye } from "lucide-react";

export interface MatchingData {
  sets: { left: string[]; right: string[]; explanations?: string[] }[];
}

// Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MatchSet = ({ set, idx }: { set: { left: string[]; right: string[]; explanations?: string[] }; idx: number }) => {
  const [seed, setSeed] = useState(0);
  const shuffledRight = useMemo(() => {
    const indexed = set.right.map((r, i) => ({ r, originalIndex: i }));
    return shuffle(indexed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, seed]);

  const [pickedLeft, setPickedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [showExplanations, setShowExplanations] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const rightRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number; correct: boolean }[]>([]);

  const pickLeft = (i: number) => {
    if (showAnswers) return;
    setPickedLeft(i);
  };
  
  const pickRight = (originalIndex: number) => {
    if (pickedLeft == null || showAnswers) return;
    setMatches((m) => {
      const next: Record<number, number> = {};
      for (const [l, r] of Object.entries(m)) {
        if (Number(l) !== pickedLeft && r !== originalIndex) next[Number(l)] = r;
      }
      next[pickedLeft] = originalIndex;
      return next;
    });
    setPickedLeft(null);
  };

  const reset = () => {
    setMatches({});
    setPickedLeft(null);
    setShowAnswers(false);
    setShowExplanations(false);
    setLines([]);
    setSeed((s) => s + 1);
  };

  const toggleShow = () => {
    if (!showAnswers) {
      const correctMatches: Record<number, number> = {};
      for (let i = 0; i < set.left.length; i++) correctMatches[i] = i;
      setMatches(correctMatches);
      setPickedLeft(null);
    } else {
      setMatches({});
    }
    setShowAnswers(!showAnswers);
  };

  const updateLines = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLines = [];
    for (let i = 0; i < set.left.length; i++) {
      if (matches[i] != null) {
        const leftEl = leftRefs.current[i];
        const rightIndex = shuffledRight.findIndex((sr) => sr.originalIndex === matches[i]);
        const rightEl = rightRefs.current[rightIndex];
        if (leftEl && rightEl) {
          const lRect = leftEl.getBoundingClientRect();
          const rRect = rightEl.getBoundingClientRect();
          newLines.push({
            x1: lRect.right - containerRect.left,
            y1: lRect.top + lRect.height / 2 - containerRect.top,
            x2: rRect.left - containerRect.left,
            y2: rRect.top + rRect.height / 2 - containerRect.top,
            correct: matches[i] === i,
          });
        }
      }
    }
    setLines(newLines);
  };

  // Run line updates when layout might change or matches change
  useEffect(() => {
    // Small timeout ensures the DOM has fully rendered the matched states
    const t = setTimeout(updateLines, 50);
    window.addEventListener("resize", updateLines);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateLines);
    };
  }, [matches, showAnswers, shuffledRight]);

  const usedRight = new Set(Object.values(matches));

  return (
    <div className="glass-strong p-5 rounded-xl relative overflow-hidden" ref={containerRef}>
      <div className="flex justify-between items-center mb-4 relative z-20">
        <h4 className="font-medium">Set {idx + 1}</h4>
        <div className="flex gap-2">
          {set.explanations && set.explanations.length > 0 && !showAnswers && (
            <Button variant="ghost" size="sm" onClick={() => setShowExplanations(!showExplanations)} className="text-primary hover:bg-primary/10 hover:text-primary">
              {showExplanations ? "Hide Explanations" : "Explain"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={toggleShow} className={showAnswers ? "bg-primary/20 border-primary text-primary" : ""}>
            <Eye className="h-3 w-3 mr-2" /> {showAnswers ? "Hide Answers" : "Show Answers"}
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="h-3 w-3 mr-2" /> Reset
          </Button>
        </div>
      </div>
      
      {/* SVG overlay for lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
        {lines.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className={`animate-in fade-in duration-300 ${
              l.correct 
                ? "text-success/80 drop-shadow-[0_0_8px_hsla(var(--success),0.5)]" 
                : "text-destructive/80 drop-shadow-[0_0_8px_hsla(var(--destructive),0.5)]"
            }`}
          />
        ))}
      </svg>

      <div className="grid grid-cols-2 gap-12 sm:gap-20 relative z-20">
        <div className="space-y-2">
          {set.left.map((l, i) => {
            const matched = matches[i] != null;
            const correct = matched && matches[i] === i;
            const wrong = matched && !correct;
            const active = pickedLeft === i;
            return (
              <button
                key={i}
                ref={(el) => (leftRefs.current[i] = el)}
                onClick={() => pickLeft(i)}
                className={`w-full text-left p-3 rounded-lg text-sm border transition-all relative bg-background/50 backdrop-blur-sm
                  ${active ? "border-primary glow-ring" : "border-border/60 hover:border-primary/60"}
                  ${correct ? "border-success/70 bg-success/10" : ""}
                  ${wrong ? "border-destructive/70 bg-destructive/10" : ""}`}
              >
                <span className="font-mono text-xs text-muted-foreground mr-2">{i + 1}.</span>{l}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {shuffledRight.map(({ r, originalIndex }, j) => {
            const used = usedRight.has(originalIndex);
            return (
              <button
                key={j}
                ref={(el) => (rightRefs.current[j] = el)}
                onClick={() => pickRight(originalIndex)}
                disabled={pickedLeft == null && !showAnswers}
                className={`w-full text-left p-3 rounded-lg text-sm border transition-all relative bg-background/50 backdrop-blur-sm
                  ${pickedLeft == null && !showAnswers ? "opacity-70 cursor-not-allowed" : "hover:border-primary/60"}
                  ${used ? (showAnswers ? "border-success/70 bg-success/10" : "border-primary/40 bg-primary/5") : "border-border/60"}
                `}
              >
                <span className="font-mono text-xs text-muted-foreground mr-2">{String.fromCharCode(65 + j)}.</span>{r}
                {used && !showAnswers && <Check className="h-3.5 w-3.5 inline ml-2 text-primary-glow" />}
              </button>
            );
          })}
        </div>
      </div>

      {showAnswers && (
        <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20 relative z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h5 className="text-xs font-medium uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5" /> Answer Key
          </h5>
          <div className="flex flex-wrap gap-2">
            {set.left.map((_, i) => {
              const rightIndex = shuffledRight.findIndex((sr) => sr.originalIndex === i);
              const letter = String.fromCharCode(65 + rightIndex);
              return (
                <span key={i} className="font-mono text-xs bg-background/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-primary/30 text-foreground shadow-sm">
                  {i + 1} - {letter}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {(showAnswers || showExplanations) && set.explanations && set.explanations.length > 0 && (
        <div className="mt-4 space-y-2 relative z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h5 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Explanations</h5>
          <div className="grid gap-2">
            {set.explanations.map((exp, i) => (
              <div key={i} className="p-3 bg-background/50 rounded-lg border-l-2 border-l-primary/50 text-sm text-foreground/80">
                <span className="font-mono text-xs text-primary-glow mr-2">{i + 1}.</span>
                {exp}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const MatchingView = ({ data }: { data: MatchingData }) => (
  <div className="space-y-4">
    <h3 className="font-display text-lg font-semibold text-gradient">Matching Exercise</h3>
    <p className="text-xs text-muted-foreground">Click an item on the left, then its match on the right.</p>
    {data.sets.map((s, i) => <MatchSet key={i} set={s} idx={i} />)}
  </div>
);
