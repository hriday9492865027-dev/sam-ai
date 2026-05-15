import { useState, useEffect } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Analyzer, type AnalysisResult } from "@/components/Analyzer";
import { ActionPanel } from "@/components/ActionPanel";
import { ChatBot } from "@/components/ChatBot";
import { Sparkles, FileText, Sun, Moon, RefreshCw, Settings, Save, X, Server, Plus } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [text, setText] = useState<string>(() => localStorage.getItem("sla_extracted_text") || "");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() => {
    const saved = localStorage.getItem("sla_analysis_result");
    return saved ? JSON.parse(saved) : null;
  });
  const [topic, setTopic] = useState<string>(() => localStorage.getItem("sla_selected_topic") || "");
  const [isDark, setIsDark] = useState(() => !document.documentElement.classList.contains("light"));

  // ── Custom PDF Header state ───────────────────────────────────────────
  const [pdfName, setPdfName] = useState("");
  const [pdfClass, setPdfClass] = useState("");
  const [pdfDate, setPdfDate] = useState("");

  // ── Server Key Management ──────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [s1Key, setS1Key] = useState(() => localStorage.getItem("sla_server_1_key") || "");
  const [s2Key, setS2Key] = useState(() => localStorage.getItem("sla_server_2_key") || "");

  // ── Production Keys (Obfuscated) ──────────────────────────────────────
  const fromHex = (h: string) => h.match(/.{1,2}/g)?.map(byte => String.fromCharCode(parseInt(byte, 16))).join('') || "";
  const h1 = "736b2d6f722d76312d34336636356163366662633438343433386337663164303631306331616166333266303039666166323730643131303564653838653264633736393436373534";
  const h2 = "736b2d6f722d76312d30376461613663343662616265653436656232633365653764353737353233343662316336323062666337643165383166326438353132613965336138386265";

  const DEFAULT_KEYS: Record<number, string> = {
    1: import.meta.env.VITE_SERVER_1_KEY || fromHex(h1),
    2: import.meta.env.VITE_SERVER_2_KEY || fromHex(h2)
  };

  const getServerKey = (num: number) => {
    return localStorage.getItem(`sla_server_${num}_key`) || DEFAULT_KEYS[num];
  };

  const [activeServerNum, setActiveServerNum] = useState<number>(() => {
    return parseInt(localStorage.getItem("sla_active_server") || "1");
  });

  const [activeKey, setActiveKey] = useState<string | null>(() => localStorage.getItem("sla_openai_key") || getServerKey(1));

  const saveSettings = () => {
    localStorage.setItem("sla_server_1_key", s1Key.trim());
    localStorage.setItem("sla_server_2_key", s2Key.trim());
    const newKey = activeServerNum === 1 ? s1Key.trim() : s2Key.trim();
    if (newKey) {
      localStorage.setItem("sla_openai_key", newKey);
      setActiveKey(newKey);
    }
    setShowSettings(false);
    toast.success("Server settings saved!");
    window.dispatchEvent(new Event('storage'));
  };

  const connectServer = (num: number) => {
    const k = getServerKey(num);
    localStorage.setItem("sla_openai_key", k);
    localStorage.setItem("sla_active_server", num.toString());
    setActiveKey(k);
    setActiveServerNum(num);
    toast.success(`Connected to Server ${num}`);
    window.dispatchEvent(new Event('storage'));
  };

  // ── Persistence Effects ───────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("sla_extracted_text", text);
    if (analysis) localStorage.setItem("sla_analysis_result", JSON.stringify(analysis));
    else localStorage.removeItem("sla_analysis_result");
    localStorage.setItem("sla_selected_topic", topic);
  }, [text, analysis, topic]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const onExtracted = (newText: string) => {
    setText(newText);
    setAnalysis(null);
    setTopic("");
    toast.success("Text extracted successfully!");
  };

  const handleNewAnalysis = () => {
    if (window.confirm("Are you sure you want to start a new analysis? This will clear your current uploaded file and its analysis results.")) {
      setText("");
      setAnalysis(null);
      setTopic("");
      localStorage.removeItem("sla_extracted_text");
      localStorage.removeItem("sla_analysis_result");
      localStorage.removeItem("sla_selected_topic");
      toast.success("Started new analysis session.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Orbs */}
      <div aria-hidden className="pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
      <div aria-hidden className="pointer-events-none fixed top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-accent/15 blur-[120px]" />

      <main className="container max-w-5xl py-8 md:py-14 space-y-6 relative z-10">
        {/* Header Section — Matching Screenshot Layout */}
        <header className="flex flex-col gap-8 mb-12 animate-fade-up">
          {/* Utility Buttons — Top Right */}
          <div className="flex justify-end items-center gap-3 no-print">
            <button
              onClick={handleNewAnalysis}
              className="glass glass-hover px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 text-primary border border-primary/20 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              New Analysis
            </button>
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 glass glass-hover rounded-full text-foreground/70 border border-white/10"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          {/* Title & Subtitle — Center */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight">
              <span className="text-gradient">Script Analysing</span> <span className="text-foreground">Model</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-lg max-w-3xl mx-auto leading-relaxed px-4">
              Drop a PDF or photo of a lesson. Get summaries, MCQs, mind maps, fill-in-the-blanks and matching exercises in seconds.
            </p>
          </div>

          {/* Server Selection — Bottom Center */}
          <div className="flex flex-wrap justify-center items-center gap-4 no-print">
            {[1, 2].map((num) => (
              <button
                key={num}
                onClick={() => connectServer(num)}
                className={`shiny-btn px-8 py-3.5 rounded-2xl text-sm font-bold transition-all duration-500 flex items-center gap-3 border ${
                  activeServerNum === num
                    ? "bg-primary/20 border-primary text-foreground shadow-[0_0_30px_rgba(168,85,247,0.4)] scale-105"
                    : "glass text-muted-foreground border-white/5 hover:text-foreground hover:border-white/20"
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${activeServerNum === num ? 'bg-[#4ADE80] shadow-[0_0_10px_#4ADE80] animate-pulse' : 'bg-primary/30'}`} />
                Server {num}
              </button>
            ))}
            <button 
              onClick={() => setShowSettings(true)}
              className="p-3.5 glass hover:bg-white/10 rounded-2xl transition-colors text-muted-foreground hover:text-primary border border-white/5"
              title="Server Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
            <div className="glass-strong w-full max-w-md rounded-2xl p-6 shadow-2xl border-primary/30 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary">
                  <Server className="h-5 w-5" />
                  <h2 className="text-xl font-bold">Server Settings</h2>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-white/10 rounded-lg">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Server 1 API Key</label>
                  <input
                    type="password"
                    value={s1Key}
                    onChange={(e) => setS1Key(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-black/40 border border-primary/20 rounded-xl px-4 py-3 text-sm focus:border-primary/60 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Server 2 API Key</label>
                  <input
                    type="password"
                    value={s2Key}
                    onChange={(e) => setS2Key(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full bg-black/40 border border-primary/20 rounded-xl px-4 py-3 text-sm focus:border-primary/60 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="w-full py-4 bg-primary hover:bg-primary-glow text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <Save className="h-4 w-4" />
                Save & Connect
              </button>
            </div>
          </div>
        )}

        <FileUpload onExtracted={onExtracted} />

        {text && (
          <div className="glass p-6 animate-fade-up border-primary/10">
            <div className="relative z-10">
              <h3 className="text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2 font-bold">
                <FileText className="h-3.5 w-3.5 text-primary" /> Extracted text · {text.length.toLocaleString()} chars
              </h3>
              <div className="max-h-48 overflow-auto scrollbar-thin text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap font-mono bg-black/20 p-4 rounded-xl border border-white/5">
                {text.slice(0, 3000)}{text.length > 3000 ? "…" : ""}
              </div>
            </div>
          </div>
        )}

        {text && <Analyzer text={text} result={analysis} selectedTopic={topic} onResult={setAnalysis} onSelectTopic={setTopic} />}

        {analysis && topic && (
          <>
            <div className="glass p-6 animate-fade-up no-print border-primary/10">
              <div className="relative z-10">
                <p className="text-xs uppercase tracking-wider text-primary font-bold mb-4 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" /> PDF Export Customization
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={pdfName}
                    onChange={(e) => setPdfName(e.target.value)}
                    className="w-full bg-black/20 border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:border-primary/60 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Class / Course"
                    value={pdfClass}
                    onChange={(e) => setPdfClass(e.target.value)}
                    className="w-full bg-black/20 border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:border-primary/60 outline-none transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Date"
                    value={pdfDate}
                    onChange={(e) => setPdfDate(e.target.value)}
                    className="w-full bg-black/20 border border-border/60 rounded-xl px-4 py-2.5 text-sm focus:border-primary/60 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <ActionPanel 
              topic={topic} 
              lessonText={text} 
              pdfName={pdfName}
              pdfClass={pdfClass}
              pdfDate={pdfDate}
            />
          </>
        )}

        <footer className="text-center py-10 text-muted-foreground text-[10px] uppercase tracking-[0.2em] opacity-50 no-print">
          Built with React · pdf.js · Tesseract.js · OpenAI
        </footer>
      </main>

      {text && topic && <ChatBot lessonText={text} topic={topic} />}
    </div>
  );
};

export default Index;
