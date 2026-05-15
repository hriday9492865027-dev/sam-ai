import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, ListChecks, StickyNote, Network, FileQuestion, ArrowLeftRight, RefreshCw, Download, MessageSquareText, Printer, PlayCircle, Layers } from "lucide-react";
import { callAI, SYSTEM_PROMPT, AIError } from "@/lib/ai";
import { toast } from "sonner";
// no types available for html2pdf.js
import html2pdf from "html2pdf.js";
import { generateCleanHtml } from "@/lib/exportUtils";
import { SummaryView } from "./outputs/SummaryView";
import { McqView, type McqData } from "./outputs/McqView";
import { ShortNotesView } from "./outputs/ShortNotesView";
import { MindMapView, type MindMapNode } from "./outputs/MindMapView";
import { FillBlanksView, type FillBlanksData } from "./outputs/FillBlanksView";
import { MatchingView, type MatchingData } from "./outputs/MatchingView";
import { ShortQAView, type ShortQAData } from "./outputs/ShortQAView";
import { FlashcardView, type FlashcardsData } from "./outputs/FlashcardView";
import { QuizMode } from "./QuizMode";

type Mode = "summary" | "mcq" | "notes" | "mindmap" | "fill" | "match" | "shortqa" | "flashcard";

interface Props {
  topic: string;
  lessonText: string;
  pdfName?: string;
  pdfClass?: string;
  pdfDate?: string;
}

const ACTIONS: { id: Mode; label: string; icon: typeof BookOpen }[] = [
  { id: "summary", label: "Summary", icon: BookOpen },
  { id: "mcq", label: "MCQs", icon: ListChecks },
  { id: "notes", label: "Short Notes", icon: StickyNote },
  { id: "mindmap", label: "Mind Map", icon: Network },
  { id: "fill", label: "Fill in Blanks", icon: FileQuestion },
  { id: "match", label: "Matching", icon: ArrowLeftRight },
  { id: "shortqa", label: "Short Q&A", icon: MessageSquareText },
  { id: "flashcard", label: "Flashcards", icon: Layers },
];

export const ActionPanel = ({ topic, lessonText, pdfName, pdfClass, pdfDate }: Props) => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<unknown>(null);
  const [quizMode, setQuizMode] = useState(false);

  // params for MCQ / matching / shortqa
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [mcqCount, setMcqCount] = useState(10);
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [fillCount, setFillCount] = useState(10);
  const [matchSets, setMatchSets] = useState(2);
  const [matchPairs, setMatchPairs] = useState(5);
  const [qaCount, setQaCount] = useState(5);
  const [qaLines, setQaLines] = useState(4);
  const [summaryType, setSummaryType] = useState<'ai' | 'book'>('ai');
  const [notesType, setNotesType] = useState<'ai' | 'book'>('ai');

  const difficultyLabel = { easy: 'simple and straightforward', medium: 'moderate difficulty', hard: 'challenging and detailed' };

  const ctx = `Topic: "${topic}"\n\nLesson context (use this as the source of truth):\n${lessonText.slice(0, 10000)}`;

  const run = async (m: Mode) => {
    setMode(m);
    setOutput(null);
    setLoading(true);
    try {
      let result: unknown;
      switch (m) {
        case "summary": {
          const prompt = summaryType === 'ai' 
            ? `Generate a complete and detailed summary of the topic without missing any important points. Use clear paragraphs. Return PLAIN TEXT only.\n\n${ctx}`
            : `Generate a detailed textbook-style summary of the topic by analyzing the provided text and structuring it as it would appear in top academic textbooks related to the subject.\n\nIMPORTANT: At the very end of your response, you MUST include a dedicated section titled "Likely Source Textbooks" and explicitly list the exact name(s) of the most likely textbook(s) or academic references that this information would be found in.\n\nReturn PLAIN TEXT only.\n\n${ctx}`;
          result = await callAI<string>({
            system: SYSTEM_PROMPT,
            user: prompt,
          });
          break;
        }
        case "mcq":
          result = await callAI<McqData>({
            system: SYSTEM_PROMPT,
            user: `Generate ${mcqCount} multiple-choice questions on the topic at ${difficultyLabel[difficulty]} level, with exactly 4 options each. Provide answers (the option letter A/B/C/D) and a brief explanation for the correct answer. Return JSON: { "questions": [ { "question": string, "options": [string,string,string,string], "answer": "A"|"B"|"C"|"D", "explanation": string } ] }\n\n${ctx}`,
            json: true,
          });
          break;
        case "notes": {
          const prompt = notesType === 'ai'
            ? `Generate concise bullet-point short notes STRICTLY ONLY on the selected topic. Ignore any other topics present in the lesson context. Focus on definitions and key facts related exclusively to this topic. Return JSON: { "notes": string[] } (10-20 items).\n\n${ctx}`
            : `Generate concise bullet-point short notes STRICTLY ONLY on the selected topic. Ignore any other topics present in the lesson context. Structure the notes as they would appear in top academic textbooks related to the subject. IMPORTANT: The final item in the array MUST explicitly state the exact name(s) of the most likely textbook(s) or academic references that this information would be found in (e.g. "Likely Source Textbooks: [Book Names]"). Return JSON: { "notes": string[] } (10-20 items).\n\n${ctx}`;
          result = await callAI<{ notes: string[] }>({
            system: SYSTEM_PROMPT,
            user: prompt,
            json: true,
          });
          break;
        }
        case "mindmap":
          result = await callAI<MindMapNode>({
            system: SYSTEM_PROMPT,
            user: `Convert the entire lesson into a hierarchical JSON suitable for a comprehensive mind map covering all major themes in the document. Return JSON of shape { "root": string, "branches": [ { "title": string, "children": [ { "title": string, "children"?: [...] } ] } ] }. 4-7 top branches, 2-5 children each, depth up to 3.\n\nLesson context (use this as the source of truth):\n${lessonText.slice(0, 10000)}`,
            json: true,
          });
          break;
        case "fill":
          result = await callAI<FillBlanksData>({
            system: SYSTEM_PROMPT,
            user: `Generate ${fillCount} fill-in-the-blank questions on the topic at ${difficultyLabel[difficulty]} level. Use "___" to denote the blank.\n\nCRITICAL: You MUST return a JSON object exactly matching this structure, and you MUST include the 'explanation' field for every single question explaining why the answer is correct:\n{ "questions": [ { "sentence": string, "answer": string, "explanation": string } ] }\n\n${ctx}`,
            json: true,
          });
          break;
        case "match": {
          const res = await callAI<MatchingData>({
            system: SYSTEM_PROMPT,
            user: `Generate a JSON object containing EXACTLY ${matchSets} sets of matching exercises on the following topic.
Level: ${difficultyLabel[difficulty]}.
Each set must contain an array of 'left' items (concepts/terms) and an array of 'right' items (definitions/descriptions).
CRITICAL: Each set MUST also contain an 'explanations' array, where explanations[i] explains the connection between left[i] and right[i].
Both 'left' and 'right' arrays must have exactly ${matchPairs} items.
Return ONLY valid JSON exactly matching this structure:
{
  "sets": [
    {
      "left": ["Term 1", "Term 2", ...],
      "right": ["Def 1", "Def 2", ...],
      "explanations": ["Explanation for Term 1", "Explanation for Term 2", ...]
    }
  ]
}

${ctx}`,
            json: true,
          });
          
          // Defensively ensure exact lengths if AI generates too many
          if (res && res.sets) {
            res.sets = res.sets.slice(0, matchSets).map(s => {
               const len = Math.min(s.left.length, s.right.length, matchPairs);
               return {
                 left: s.left.slice(0, len),
                 right: s.right.slice(0, len),
                 explanations: s.explanations ? s.explanations.slice(0, len) : undefined
               };
            });
          }
          result = res;
          break;
        }
        case "shortqa": {
          result = await callAI<ShortQAData>({
            system: SYSTEM_PROMPT,
            user: `Generate exactly ${qaCount} short-answer questions on the topic at ${difficultyLabel[difficulty]} level. Each answer should be a concise explanation that fits within ${qaLines} lines (approximately ${qaLines * 15} words per answer). Return JSON: { "qas": [ { "question": string, "answer": string } ] }.\n\n${ctx}`,
            json: true,
          });
          break;
        }
        case "flashcard":
          result = await callAI<FlashcardsData>({
            system: SYSTEM_PROMPT,
            user: `Generate exactly ${flashcardCount} double-sided flashcards on the topic at ${difficultyLabel[difficulty]} level. The front should have a key term, concept, or brief question, and the back should have the definition or answer. Return JSON: { "flashcards": [ { "front": string, "back": string } ] }.\n\n${ctx}`,
            json: true,
          });
          break;
      }
      setOutput(result);
    } catch (e) {
      toast.error(e instanceof AIError ? e.message : "Generation failed.");
      setOutput(null);
    } finally {
      setLoading(false);
    }
  };

  const handleModeClick = (m: Mode) => {
    setMode(m);
    setOutput(null);
    setQuizMode(false);
    if (m !== "mcq" && m !== "match" && m !== "shortqa" && m !== "summary" && m !== "notes" && m !== "fill" && m !== "flashcard") {
      run(m);
    }
  };

  const saveFileWithDialog = async (blob: Blob, defaultName: string) => {
    try {
      if ('showSaveFilePicker' in window) {
        const ext = defaultName.split('.').pop() || 'txt';
        const types = ext === 'pdf' ? [{
          description: 'PDF Document',
          accept: { 'application/pdf': ['.pdf'] },
        }] : [{
          description: 'Word Document',
          accept: { 'application/msword': ['.doc'] },
        }];
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultName,
          types: types,
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success(`Saved successfully`);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${defaultName}`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error("Error saving file");
      }
    }
  };

  const handleExport = async (format: 'pdf' | 'doc') => {
    if (!mode || !output) return;
    try {
      const htmlString = generateCleanHtml(
        mode,
        output,
        topic,
        mode === 'shortqa' ? { answerLines: qaLines } : undefined,
        { name: pdfName, className: pdfClass, date: pdfDate }
      );
      const filename = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${mode}.${format}`;

      if (format === 'pdf') {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlString;
        wrapper.style.backgroundColor = '#ffffff';
        wrapper.style.color = '#000000';
        wrapper.style.boxSizing = 'border-box';
        
        if (mode === 'mindmap') {
          wrapper.style.width = 'max-content';
          wrapper.style.minWidth = '1200px';
        } else {
          wrapper.style.width = '800px';
          wrapper.style.maxWidth = '100%';
        }

        let pdfOpt: any = {
          margin:       0.5,
          filename:     filename,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, backgroundColor: '#ffffff', useCORS: true },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        if (mode === 'mindmap') {
           // Use a massive standard page format (A2 Landscape) to guarantee 
           // the mind map fits on a single continuous page without cutting.
           pdfOpt.jsPDF = { 
             unit: 'in', 
             format: 'a2', 
             orientation: 'landscape' 
           };
        }
        
        const pdfBlob = await html2pdf().set(pdfOpt).from(wrapper).output('blob');
        await saveFileWithDialog(pdfBlob, filename);
      } else {
        const blob = new Blob(['\ufeff', htmlString], {
          type: 'application/msword'
        });
        await saveFileWithDialog(blob, filename);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate file");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass p-6 md:p-8 animate-fade-up">
      <div className="relative z-10 space-y-6">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-semibold mb-1">3. Generate study material</h2>
          <p className="text-sm text-muted-foreground">
            Topic: <span className="text-foreground font-medium">{topic}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ACTIONS.map((a) => {
            const Icon = a.icon;
            const active = mode === a.id;
            return (
              <button
                key={a.id}
                onClick={() => handleModeClick(a.id)}
                disabled={loading}
                className={`glass glass-hover p-3 rounded-xl flex flex-col items-center gap-2 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${active ? "glass-active" : ""}`}
              >
                <Icon className="h-5 w-5 relative z-10" />
                <span className="relative z-10 text-center">{a.label}</span>
              </button>
            );
          })}
        </div>

        {/* Parameter rows */}
        {mode && !loading && !output && (
          <div className="animate-fade-up">
            <ParamRow label="Difficulty">
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <Pill key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Pill>
              ))}
            </ParamRow>
          </div>
        )}

        {mode === "summary" && !loading && (
          <div className="space-y-4 animate-fade-up">
            <ParamRow label="Summary Type">
              <Pill active={summaryType === 'ai'} onClick={() => setSummaryType('ai')}>
                AI Summary
              </Pill>
              <Pill active={summaryType === 'book'} onClick={() => setSummaryType('book')}>
                Book Summary
              </Pill>
            </ParamRow>
            {!output && (
              <Button onClick={() => run(mode)} className="mt-2">
                Generate Summary
              </Button>
            )}
          </div>
        )}

        {mode === "notes" && !loading && (
          <div className="space-y-4 animate-fade-up">
            <ParamRow label="Notes Type">
              <Pill active={notesType === 'ai'} onClick={() => setNotesType('ai')}>
                AI Notes
              </Pill>
              <Pill active={notesType === 'book'} onClick={() => setNotesType('book')}>
                Book Notes
              </Pill>
            </ParamRow>
            {!output && (
              <Button onClick={() => run(mode)} className="mt-2">
                Generate Notes
              </Button>
            )}
          </div>
        )}

        {mode === "mcq" && !loading && (
          <div className="space-y-4 animate-fade-up">
            <ParamRow label="Number of questions">
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <Pill key={n} active={mcqCount === n} onClick={() => setMcqCount(n)}>{n}</Pill>
              ))}
            </ParamRow>
            {!output && (
              <Button onClick={() => run(mode)} className="mt-2">
                Generate MCQs
              </Button>
            )}
          </div>
        )}
        {mode === "fill" && !loading && (
          <div className="space-y-4 animate-fade-up">
            <ParamRow label="Number of questions">
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <Pill key={n} active={fillCount === n} onClick={() => setFillCount(n)}>{n}</Pill>
              ))}
            </ParamRow>
            {!output && (
              <Button onClick={() => run(mode)} className="mt-2">
                Generate Fill in the Blanks
              </Button>
            )}
          </div>
        )}
        {mode === "match" && !loading && (
          <div className="space-y-4 animate-fade-up">
            <div className="space-y-3">
              <ParamRow label="Sets">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <Pill key={n} active={matchSets === n} onClick={() => setMatchSets(n)}>{n}</Pill>
                ))}
              </ParamRow>
              <ParamRow label="Pairs per set">
                {[4, 5, 6, 7, 8].map((n) => (
                  <Pill key={n} active={matchPairs === n} onClick={() => setMatchPairs(n)}>{n}</Pill>
                ))}
              </ParamRow>
            </div>
            {!output && (
              <Button onClick={() => run(mode)} className="mt-2">
                Generate Matching
              </Button>
            )}
          </div>
        )}
        {mode === "shortqa" && !loading && (
          <div className="space-y-4 animate-fade-up">
            <div className="space-y-3">
              <ParamRow label="Number of questions">
                {[3, 5, 7, 10, 12, 15].map((n) => (
                  <Pill key={n} active={qaCount === n} onClick={() => setQaCount(n)}>{n}</Pill>
                ))}
              </ParamRow>
              <ParamRow label="Lines per answer">
                {[2, 3, 4, 5, 6, 8].map((n) => (
                  <Pill key={n} active={qaLines === n} onClick={() => setQaLines(n)}>{n}</Pill>
                ))}
              </ParamRow>
            </div>
            {!output && (
              <Button onClick={() => run(mode)} className="mt-2">
                Generate Short Q&amp;A
              </Button>
            )}
          </div>
        )}
        {mode === "flashcard" && !loading && (
          <div className="space-y-4 animate-fade-up">
            <ParamRow label="Number of flashcards">
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <Pill key={n} active={flashcardCount === n} onClick={() => setFlashcardCount(n)}>{n}</Pill>
              ))}
            </ParamRow>
            {!output && (
              <Button onClick={() => run(mode)} className="mt-2">
                Generate Flashcards
              </Button>
            )}
          </div>
        )}

        {loading && (
          <div className="glass-strong p-8 rounded-xl flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-sm text-muted-foreground">Generating with AI…</div>
          </div>
        )}

        {!loading && output != null && mode && (
          <div className="space-y-3 animate-fade-up">
            <div className="flex flex-wrap justify-end gap-2 no-print">
              {mode === 'mcq' && (
                <Button variant="outline" size="sm" onClick={() => setQuizMode(true)} className="text-primary hover:bg-primary/10">
                  <PlayCircle className="h-3 w-3 mr-2" /> Start Quiz
                </Button>
              )}
              {mode !== 'flashcard' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="text-muted-foreground hover:text-primary">
                    <Download className="h-3 w-3 mr-2" /> Save as PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleExport('doc')} className="text-muted-foreground hover:text-primary">
                    <Download className="h-3 w-3 mr-2" /> Save as DOC
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint} className="text-muted-foreground hover:text-primary">
                    <Printer className="h-3 w-3 mr-2" /> Print
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={() => run(mode)} className="text-muted-foreground">
                <RefreshCw className="h-3 w-3 mr-2" /> Regenerate
              </Button>
            </div>
            {quizMode && mode === 'mcq' ? (
              <QuizMode data={output as McqData} onClose={() => setQuizMode(false)} />
            ) : (
              <>
                {mode === "summary" && <SummaryView text={output as string} />}
                {mode === "mcq" && <McqView data={output as McqData} />}
                {mode === "notes" && <ShortNotesView notes={(output as { notes: string[] }).notes} />}
                {mode === "mindmap" && <MindMapView root={output as MindMapNode} />}
                {mode === "fill" && <FillBlanksView data={output as FillBlanksData} />}
                {mode === "match" && <MatchingView data={output as MatchingData} />}
                {mode === "shortqa" && <ShortQAView data={output as ShortQAData} answerLines={qaLines} />}
                {mode === "flashcard" && <FlashcardView data={output as FlashcardsData} />}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ParamRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-xs uppercase tracking-wider text-muted-foreground mr-2">{label}:</span>
    {children}
  </div>
);

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
      active
        ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground border-transparent shadow-lg"
        : "border-border/60 text-muted-foreground hover:border-primary/60 hover:text-foreground"
    }`}
  >
    {children}
  </button>
);
