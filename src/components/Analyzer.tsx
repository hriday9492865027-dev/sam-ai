import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Tag } from "lucide-react";
import { callAI, SYSTEM_PROMPT, AIError } from "@/lib/ai";
import { toast } from "sonner";

export interface AnalysisResult {
  summary: string;
  topics: string[];
  keywords: string[];
  key_concepts: string[];
}

interface Props {
  text: string;
  result: AnalysisResult | null;
  selectedTopic: string | null;
  onResult: (r: AnalysisResult) => void;
  onSelectTopic: (t: string) => void;
}

export const Analyzer = ({ text, result, selectedTopic, onResult, onSelectTopic }: Props) => {
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!text || text.length < 10) {
      toast.error("Need more extracted text to analyze. Try a clearer PDF or image.");
      return;
    }
    setLoading(true);
    try {
      const r = await callAI<AnalysisResult>({
        system: SYSTEM_PROMPT,
        user: `Analyze the following lesson and return JSON with this exact shape: { "summary": string, "topics": string[], "keywords": string[], "key_concepts": string[] }. The summary should be 3-6 sentences. Topics should be 4-10 distinct sub-topics covered. Keywords should be 8-15 important terms. key_concepts should be 4-8 short phrases of the central ideas. Do not omit important points.\n\n--- LESSON ---\n${text.slice(0, 12000)}`,
        json: true,
      });
      onResult(r);
      toast.success("Analysis complete.");
    } catch (e) {
      toast.error(e instanceof AIError ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass p-6 md:p-8 animate-fade-up">
      <div className="relative z-10">
        <h2 className="font-display text-xl md:text-2xl font-semibold mb-1">2. Analyze with AI</h2>
        <p className="text-sm text-muted-foreground mb-5">Get a summary, topics and key concepts.</p>

        {!result && (
          <Button
            onClick={analyze}
            disabled={loading || !text}
            className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:opacity-90 shadow-lg"
          >
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</> : <><Sparkles className="h-4 w-4 mr-2" /> Analyze lesson</>}
          </Button>
        )}

        {result && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Summary</h3>
              <p className="leading-relaxed text-foreground/90">{result.summary}</p>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" /> Pick a topic to study
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.topics.map((t) => {
                  const active = selectedTopic === t;
                  return (
                    <button
                      key={t}
                      onClick={() => onSelectTopic(t)}
                      className={`glass glass-hover px-4 py-2 text-sm font-medium rounded-full ${active ? "glass-active" : ""}`}
                    >
                      <span className="relative z-10">{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="glass-strong p-4 rounded-xl">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.keywords.map((k) => (
                    <span key={k} className="text-xs px-2 py-1 rounded-md bg-primary/15 text-primary-glow border border-primary/30">{k}</span>
                  ))}
                </div>
              </div>
              <div className="glass-strong p-4 rounded-xl">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Key concepts</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-foreground/90">
                  {result.key_concepts.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>
            </div>

            <Button onClick={analyze} disabled={loading} variant="ghost" size="sm" className="text-muted-foreground">
              {loading ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : <Sparkles className="h-3 w-3 mr-2" />}
              Re-analyze
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
